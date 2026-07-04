/**
 * @module polling/engine
 * Adaptive polling loop with circuit breaker, LRU seen-ID cache, and graceful shutdown.
 *
 * Architecture:
 *   - Adaptive interval: scales down on activity, up when quiet.
 *   - Circuit breaker: opens after N consecutive errors, auto-recovers after cooldown.
 *   - Per-cycle timeout: hung HTTP calls never stall the loop.
 *   - LRU eviction: seenMessageIds capped at 5,000 entries.
 *   - Reply-handler sweep: periodic cleanup prevents leaks.
 *   - SIGTERM / SIGINT: graceful shutdown with event emission.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

import logger                              from '../Logger.js';
import { sleep }                           from '../utils/sleep.js';
import { withTimeout }                     from '../utils/timeout.js';
import { classifyError, formatUptime }     from '../utils/format.js';
import { exponentialBackoff }              from '../utils/retry.js';

const SEEN_IDS_MAX    = 5_000;
const SEEN_IDS_EVICT  = 2_500;
const POLL_TIMEOUT_MS = 20_000;

export class PollingEngine {
  constructor(ig, client) {
    this.ig             = ig;
    this.client         = client;
    this.isPolling      = false;
    this.isSeeded       = false;
    this.shutdownBound  = false;

    this.seenMessageIds    = new Set();
    this.seenIdTimestamps  = new Map();
    this.threadLastItemMap = new Map();
    this.replyHandlers     = new Map();

    this.stats = {
      startedAt:         null,
      totalPolls:        0,
      totalErrors:       0,
      consecutiveErrors: 0,
      lastPollAt:        null,
      lastErrorAt:       null,
      lastErrorMsg:      null,
      circuitOpen:       false,
      circuitOpenedAt:   null,
      currentInterval:   5_000,
    };
  }

  // ─── Seen-ID management ────────────────────────────────────────────────────

  trackSeen(itemId) {
    this.seenMessageIds.add(itemId);
    this.seenIdTimestamps.set(itemId, Date.now());
    this.evictOldSeenIds();
  }

  evictOldSeenIds() {
    if (this.seenMessageIds.size <= SEEN_IDS_MAX) return;

    const sorted = [...this.seenIdTimestamps.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, SEEN_IDS_EVICT);

    for (const [id] of sorted) {
      this.seenMessageIds.delete(id);
      this.seenIdTimestamps.delete(id);
    }
    logger.debug(`Evicted ${SEEN_IDS_EVICT} old seen IDs (${this.seenMessageIds.size} remaining)`);
  }

  // ─── Reply-handler sweep ───────────────────────────────────────────────────

  sweepExpiredReplyHandlers(maxAge = 300_000) {
    const now = Date.now();
    let swept = 0;
    for (const [id, entry] of this.replyHandlers) {
      if (now - entry.registeredAt > maxAge) {
        clearTimeout(entry.timerId);
        this.replyHandlers.delete(id);
        swept++;
      }
    }
    if (swept > 0) logger.debug(`Swept ${swept} expired reply handlers`);
  }

  // ─── Observability ─────────────────────────────────────────────────────────

  getPollingStats() {
    const uptime = this.stats.startedAt ? Date.now() - this.stats.startedAt : 0;
    return {
      ...this.stats,
      uptime,
      uptimeFormatted:   formatUptime(uptime),
      seenIdCount:       this.seenMessageIds.size,
      replyHandlerCount: this.replyHandlers.size,
      trackedThreads:    this.threadLastItemMap.size,
    };
  }

  // ─── Shutdown handlers ─────────────────────────────────────────────────────

  registerShutdownHandlers() {
    if (this.shutdownBound) return;
    this.shutdownBound = true;

    const shutdown = async (signal) => {
      logger.warn(`Received ${signal} — stopping bot gracefully...`);
      this.stopPolling();
      this.client.emit('shutdown', { signal });
      await sleep(500);
      process.exit(0);
    };

    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    process.once('SIGINT',  () => void shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err.message);
      this.client.emit('error', err);
    });
    process.on('unhandledRejection', (reason) => {
      const msg = String(reason);
      logger.error('Unhandled rejection:', msg);
      this.client.emit('error', new Error(msg));
    });
  }

  // ─── Seed ──────────────────────────────────────────────────────────────────

  async seedSeenIds() {
    try {
      logger.info('Seeding existing message IDs...');
      const feed    = this.ig.feed.directInbox();
      const threads = await withTimeout(feed.items(), POLL_TIMEOUT_MS, 'seed');

      for (const thread of threads) {
        const last = thread.last_permanent_item;
        if (last?.item_id) {
          this.trackSeen(last.item_id);
          this.threadLastItemMap.set(thread.thread_id, last.item_id);
        }
        for (const item of (thread.items ?? [])) {
          if (item?.item_id) this.trackSeen(item.item_id);
        }
      }

      this.isSeeded = true;
      logger.info(
        `Seeded ${this.seenMessageIds.size} message IDs across ${threads.length} threads`,
      );
    } catch (err) {
      logger.warn('Could not seed message IDs:', err.message);
      this.isSeeded = true;
    }
  }

  // ─── Poll cycle ────────────────────────────────────────────────────────────

  async pollCycle() {
    const feed    = this.ig.feed.directInbox();
    const threads = await withTimeout(feed.items(), POLL_TIMEOUT_MS, 'inbox');
    if (!threads.length) return false;

    let hadActivity = false;

    for (const thread of threads) {
      const threadId = thread.thread_id;
      const lastPerm = thread.last_permanent_item;
      if (!lastPerm?.item_id) continue;

      const prevId = this.threadLastItemMap.get(threadId);
      if (prevId === lastPerm.item_id) continue;

      this.threadLastItemMap.set(threadId, lastPerm.item_id);

      for (const item of (thread.items ?? [])) {
        if (!item?.item_id || this.seenMessageIds.has(item.item_id)) continue;
        this.trackSeen(item.item_id);

        const isFromMe = String(item.user_id) === String(this.client.userId);

        const event = {
          thread_id:    threadId,
          item_id:      item.item_id,
          user_id:      item.user_id ?? '',
          text:         item.text ?? '',
          timestamp:    item.timestamp ?? '',
          is_from_me:   isFromMe,
          thread_title: thread.thread_title ?? null,
          thread_users: thread.users ?? [],
          message:      item,
        };

        const replied = item.replied_to_message;
        if (replied?.item_id) {
          event.messageReply = {
            item_id:   replied.item_id,
            text:      replied.text ?? '',
            user_id:   replied.user_id ?? '',
            timestamp: replied.timestamp ?? '',
          };

          const handler = this.replyHandlers.get(replied.item_id);
          if (handler) {
            try {
              await handler.callback(event);
              clearTimeout(handler.timerId);
              this.replyHandlers.delete(replied.item_id);
            } catch (err) {
              logger.error('Reply handler error:', err.message);
            }
          }
        }

        this.client.emit('message', event);

        if (!isFromMe) {
          hadActivity = true;
          logger.debug(
            `New msg in ${threadId} from ${item.user_id}: ${(item.text ?? '(media)').substring(0, 60)}`,
          );
        }
      }
    }

    // Check pending DMs
    try {
      const pending = this.ig.feed.directPending();
      const pthr    = await pending.items();
      if (pthr.length > 0) {
        this.client.emit('pending_request', { count: pthr.length, threads: pthr });
      }
    } catch { /* non-fatal */ }

    return hadActivity;
  }

  // ─── Polling control ───────────────────────────────────────────────────────

  async startPolling(options = 5_000) {
    if (this.isPolling) { logger.warn('Polling already active'); return; }

    const opts = typeof options === 'number' ? { interval: options } : options;
    const {
      interval             = 5_000,
      minInterval          = 3_000,
      maxInterval          = 30_000,
      maxConsecutiveErrors = 5,
      circuitCooldown      = 60_000,
    } = opts;

    this.isPolling               = true;
    this.stats.startedAt         = Date.now();
    this.stats.currentInterval   = interval;
    this.stats.circuitOpen       = false;
    this.stats.consecutiveErrors = 0;

    this.registerShutdownHandlers();
    if (!this.isSeeded) await this.seedSeenIds();

    logger.event(`Polling started (interval: ${interval}ms, min: ${minInterval}ms, max: ${maxInterval}ms)`);
    this.client.emit('polling:start', { interval });

    let sweepCounter = 0;

    while (this.isPolling) {
      // ── Circuit breaker cooldown ───────────────────────────────────────────
      if (this.stats.circuitOpen) {
        const elapsed = Date.now() - (this.stats.circuitOpenedAt ?? 0);
        if (elapsed < circuitCooldown) {
          await sleep(Math.min(5_000, circuitCooldown - elapsed));
          continue;
        }
        this.stats.circuitOpen       = false;
        this.stats.consecutiveErrors = 0;
        logger.event('Circuit breaker closed — resuming polling');
        this.client.emit('circuit:closed');
      }

      // ── Poll ──────────────────────────────────────────────────────────────
      try {
        const hadActivity = await withTimeout(
          this.pollCycle(),
          POLL_TIMEOUT_MS + 5_000,
          'pollCycle',
        );

        this.stats.totalPolls++;
        this.stats.lastPollAt        = Date.now();
        this.stats.consecutiveErrors = 0;

        sweepCounter++;
        if (sweepCounter % 20 === 0) this.sweepExpiredReplyHandlers();

        const cur  = this.stats.currentInterval;
        const next = hadActivity
          ? Math.max(minInterval, cur * 0.75)
          : Math.min(maxInterval, cur * 1.1);
        this.stats.currentInterval = Math.round(next);

      } catch (error) {
        this.stats.totalErrors++;
        this.stats.consecutiveErrors++;
        this.stats.lastErrorAt  = Date.now();
        this.stats.lastErrorMsg = error.message;

        const kind = classifyError(error);

        if (kind === 'auth') {
          logger.error('Session expired — stopping polling');
          this.client.emit('session:expired', { error });
          this.isPolling = false;
          break;
        }

        logger.error(`Poll error #${this.stats.consecutiveErrors} [${kind}]: ${error.message}`);
        this.client.emit('error', error);

        if (this.stats.consecutiveErrors >= maxConsecutiveErrors) {
          this.stats.circuitOpen     = true;
          this.stats.circuitOpenedAt = Date.now();
          logger.warn(
            `Circuit breaker opened after ${maxConsecutiveErrors} errors — cooling down ${circuitCooldown / 1000}s`,
          );
          this.client.emit('circuit:open', {
            consecutiveErrors: this.stats.consecutiveErrors,
            cooldown: circuitCooldown,
          });
          continue;
        }

        const backoff = exponentialBackoff(this.stats.consecutiveErrors, 2_000, 30_000);
        await sleep(backoff);
        continue;
      }

      await sleep(this.stats.currentInterval);
    }

    logger.event('Polling stopped');
    this.client.emit('polling:stop', this.getPollingStats());
  }

  stopPolling() {
    if (!this.isPolling) return;
    this.isPolling = false;
    logger.event('Polling stop requested');
  }

  async restartPolling(options) {
    this.stopPolling();
    await sleep(1_000);
    this.isSeeded = false;
    return this.startPolling(options ?? this.stats.currentInterval);
  }
}
