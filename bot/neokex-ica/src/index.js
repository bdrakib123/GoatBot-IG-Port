import InstagramClientV2 from './InstagramClientV2.js';
import DirectMessageV2   from './DirectMessageV2.js';
import banner            from './Banner.js';

const VERSION = '1.0.0';
let bannerShown = false;

class InstagramChatAPI extends InstagramClientV2 {
  constructor(options = {}) {
    super();
    this.optionsIca = options;
    this.dm = new DirectMessageV2(this);

    if (!bannerShown && options.showBanner !== false) {
      banner.showFull(VERSION, 140);
      bannerShown = true;
    }
  }

  getStatus() {
    return {
      isLoggedIn:   this.isLoggedIn,
      userId:       this.userId,
      username:     this.username,
      isPolling:    this.dm.isPolling,
      pollingStats: this.dm.getPollingStats(),
    };
  }

  getPollingStats() {
    return this.dm.getPollingStats();
  }

  async login(username, password) {
    return super.login(username, password);
  }

  loadCookiesFromFile(filePath) {
    return super.loadCookiesFromFile(filePath);
  }

  saveCookiesToFile(filePath, domain = '.instagram.com') {
    return super.saveCookiesToFile(filePath, domain);
  }

  setCookies(cookies) {
    return super.setCookies(cookies);
  }

  getCookies() {
    return super.getCookies();
  }

  getCurrentUserID() {
    return super.getCurrentUserID();
  }

  getCurrentUsername() {
    return super.getCurrentUsername();
  }

  async getSessionState() {
    return super.getSessionState();
  }

  async loadSessionState(sessionState) {
    return super.loadSessionState(sessionState);
  }

  async validateSession() {
    return super.validateSession();
  }

  async pingSession() {
    return super.pingSession();
  }

  getIgClient() {
    return super.getIgClient();
  }

  async startPolling(options = 5000) {
    return this.dm.startPolling(options);
  }

  async startListening(intervalOrOptions = 5000) {
    return this.dm.startPolling(intervalOrOptions);
  }

  stopPolling() {
    this.dm.stopPolling();
  }

  stopListening() {
    this.dm.stopPolling();
  }

  async restartPolling(options) {
    return this.dm.restartPolling(options);
  }

  onMessage(callback)         { this.on('message', callback); }
  onPendingRequest(callback)  { this.on('pending_request', callback); }
  onError(callback)           { this.on('error', callback); }
  onLogin(callback)           { this.on('login', callback); }
  onRateLimit(callback)       { this.on('ratelimit', callback); }
  onTyping(callback)          { this.on('typing', callback); }
  onPollingStart(callback)    { this.on('polling:start', callback); }
  onPollingStop(callback)     { this.on('polling:stop', callback); }
  onSessionExpired(callback)  { this.on('session:expired', callback); }
  onCircuitOpen(callback)     { this.on('circuit:open', callback); }
  onCircuitClosed(callback)   { this.on('circuit:closed', callback); }
  onShutdown(callback)        { this.on('shutdown', callback); }

  async sendMessage(threadId, text, options = {}) {
    return this.dm.sendMessage(threadId, text, options);
  }

  async sendMessageToUser(userId, text, options = {}) {
    return this.dm.sendMessageToUser(userId, text, options);
  }

  async sendMessageBulk(threadIds, text, delayBetween = 1500) {
    return this.dm.sendMessageBulk(threadIds, text, delayBetween);
  }

  scheduleMessage(threadId, text, delayMs, options = {}) {
    return this.dm.scheduleMessage(threadId, text, delayMs, options);
  }

  async sendMessageWithReply(threadId, text, onReplyCallback, options = {}) {
    return this.dm.sendMessageWithReply(threadId, text, onReplyCallback, options);
  }

  async sendMessageToUserWithReply(userId, text, onReplyCallback, options = {}) {
    return this.dm.sendMessageToUserWithReply(userId, text, onReplyCallback, options);
  }

  registerReplyHandler(itemId, callback, timeout = 120000) {
    return this.dm.registerReplyHandler(itemId, callback, timeout);
  }

  clearReplyHandler(itemId) {
    return this.dm.clearReplyHandler(itemId);
  }

  async unsendMessage(threadId, itemId) {
    return this.dm.unsendMessage(threadId, itemId);
  }

  async editMessage(threadId, itemId, newText) {
    return this.dm.editMessage(threadId, itemId, newText);
  }

  async sendReaction(threadId, itemId, emoji) {
    return this.dm.sendReaction(threadId, itemId, emoji);
  }

  async removeReaction(threadId, itemId) {
    return this.dm.removeReaction(threadId, itemId);
  }

  async indicateTyping(threadId, isTyping = true) {
    return this.dm.indicateTyping(threadId, isTyping);
  }

  async getInbox(options = {}) {
    return this.dm.getInbox(options);
  }

  async getFullInbox(maxPages = 5) {
    return this.dm.getFullInbox(maxPages);
  }

  async getUnreadThreads() {
    return this.dm.getUnreadThreads();
  }

  async getPendingInbox() {
    return this.dm.getPendingInbox();
  }

  async getThread(threadId, options = {}) {
    return this.dm.getThread(threadId, options);
  }

  async getThreadMessages(threadId, limit = 20) {
    return this.dm.getThreadMessages(threadId, limit);
  }

  async getThreadParticipants(threadId) {
    return this.dm.getThreadParticipants(threadId);
  }

  async getThreadIdByUsername(username) {
    return this.dm.getThreadIdByUsername(username);
  }

  async getRecentMessages(limit = 20) {
    return this.dm.getRecentMessages(limit);
  }

  async searchMessages(threadId, query) {
    return this.dm.searchMessages(threadId, query);
  }

  async createThread(userIds) {
    return this.dm.createThread(userIds);
  }

  async markAsSeen(threadId, itemId) {
    return this.dm.markAsSeen(threadId, itemId);
  }

  async markAllThreadsSeen() {
    return this.dm.markAllThreadsSeen();
  }

  async approveThread(threadId) {
    return this.dm.approveThread(threadId);
  }

  async declineThread(threadId) {
    return this.dm.declineThread(threadId);
  }

  async muteThread(threadId) {
    return this.dm.muteThread(threadId);
  }

  async unmuteThread(threadId) {
    return this.dm.unmuteThread(threadId);
  }

  async deleteThread(threadId) {
    return this.dm.deleteThread(threadId);
  }

  async archiveThread(threadId) {
    return this.dm.archiveThread(threadId);
  }

  async unarchiveThread(threadId) {
    return this.dm.unarchiveThread(threadId);
  }

  async leaveThread(threadId) {
    return this.dm.leaveThread(threadId);
  }

  async addUsersToThread(threadId, userIds) {
    return this.dm.addUsersToThread(threadId, userIds);
  }

  async removeUserFromThread(threadId, userId) {
    return this.dm.removeUserFromThread(threadId, userId);
  }

  async updateThreadTitle(threadId, title) {
    return this.dm.updateThreadTitle(threadId, title);
  }

  async sendPhoto(threadId, photoPath) {
    return this.dm.sendPhoto(threadId, photoPath);
  }

  async sendPhotoWithCaption(threadId, photoPath, caption = '') {
    return this.dm.sendPhotoWithCaption(threadId, photoPath, caption);
  }

  async sendPhotoFromUrl(threadId, photoUrl) {
    return this.dm.sendPhotoFromUrl(threadId, photoUrl);
  }

  async sendVideo(threadId, videoPath) {
    return this.dm.sendVideo(threadId, videoPath);
  }

  async sendVideoFromUrl(threadId, videoUrl) {
    return this.dm.sendVideoFromUrl(threadId, videoUrl);
  }

  async sendVoiceNote(threadId, audioPath) {
    return this.dm.sendVoiceNote(threadId, audioPath);
  }

  async sendSticker(threadId, stickerId) {
    return this.dm.sendSticker(threadId, stickerId);
  }

  async sendGif(threadId, giphyId) {
    return this.dm.sendGif(threadId, giphyId);
  }

  async sendAnimatedMedia(threadId, mediaId) {
    return this.dm.sendAnimatedMedia(threadId, mediaId);
  }

  async shareMediaToThread(threadId, mediaId, message = '') {
    return this.dm.shareMediaToThread(threadId, mediaId, message);
  }

  async sendLink(threadId, linkUrl, linkText = '') {
    return this.dm.sendLink(threadId, linkUrl, linkText);
  }

  async getMessageMediaUrl(threadId, itemId) {
    return this.dm.getMessageMediaUrl(threadId, itemId);
  }

  async downloadMessageMedia(threadId, itemId, savePath = null) {
    return this.dm.downloadMessageMedia(threadId, itemId, savePath);
  }

  async forwardMessage(fromThreadId, toThreadId, itemId) {
    return this.dm.forwardMessage(fromThreadId, toThreadId, itemId);
  }

  async getUserInfo(userId) {
    return super.getUserInfo(userId);
  }

  async getUserInfoByUsername(username) {
    return super.getUserInfoByUsername(username);
  }

  async searchUsers(query) {
    return super.searchUsers(query);
  }

  async getFriendshipStatus(userId) {
    return super.getFriendshipStatus(userId);
  }

  async getFriendshipStatuses(userIds) {
    return super.getFriendshipStatuses(userIds);
  }

  async followUser(userId) {
    return super.followUser(userId);
  }

  async unfollowUser(userId) {
    return super.unfollowUser(userId);
  }

  async blockUser(userId) {
    return super.blockUser(userId);
  }

  async unblockUser(userId) {
    return super.unblockUser(userId);
  }

  async getBlockedUsers() {
    return super.getBlockedUsers();
  }

  async muteUser(userId, muteStories = false, mutePosts = false) {
    return super.muteUser(userId, muteStories, mutePosts);
  }

  async getFollowers(userId, maxItems = 100) {
    return super.getFollowers(userId, maxItems);
  }

  async getFollowing(userId, maxItems = 100) {
    return super.getFollowing(userId, maxItems);
  }

  async getSuggestedUsers(maxItems = 30) {
    return super.getSuggestedUsers(maxItems);
  }

  async getTimelineFeed(maxItems = 30) {
    return super.getTimelineFeed(maxItems);
  }

  async getUserFeed(userId, maxItems = 30) {
    return super.getUserFeed(userId, maxItems);
  }

  async getHashtagFeed(hashtag, maxItems = 30) {
    return super.getHashtagFeed(hashtag, maxItems);
  }

  async getExploreFeed(maxItems = 30) {
    return super.getExploreFeed(maxItems);
  }

  async getLocationFeed(locationId, maxItems = 30) {
    return super.getLocationFeed(locationId, maxItems);
  }

  async getLikedPosts(maxItems = 30) {
    return super.getLikedPosts(maxItems);
  }

  async getActivityFeed() {
    return super.getActivityFeed();
  }

  async getReelsTrayCandidates() {
    return super.getReelsTrayCandidates();
  }

  async likePost(mediaId) {
    return super.likePost(mediaId);
  }

  async unlikePost(mediaId) {
    return super.unlikePost(mediaId);
  }

  async commentPost(mediaId, text) {
    return super.commentPost(mediaId, text);
  }

  async deleteComment(mediaId, commentId) {
    return super.deleteComment(mediaId, commentId);
  }

  async likeComment(mediaId, commentId) {
    return super.likeComment(mediaId, commentId);
  }

  async unlikeComment(mediaId, commentId) {
    return super.unlikeComment(mediaId, commentId);
  }

  async getComments(mediaId, maxItems = 20) {
    return super.getComments(mediaId, maxItems);
  }

  async getMediaInfo(mediaId) {
    return super.getMediaInfo(mediaId);
  }

  async deletePost(mediaId) {
    return super.deletePost(mediaId);
  }

  async getTaggedPosts(userId, maxItems = 30) {
    return super.getTaggedPosts(userId, maxItems);
  }

  async getSavedPosts(maxItems = 30) {
    return super.getSavedPosts(maxItems);
  }

  async savePost(mediaId) {
    return super.savePost(mediaId);
  }

  async unsavePost(mediaId) {
    return super.unsavePost(mediaId);
  }

  async uploadPhoto(photoPath, caption = '') {
    return super.uploadPhoto(photoPath, caption);
  }

  async uploadVideo(videoPath, caption = '', coverPath = null) {
    return super.uploadVideo(videoPath, caption, coverPath);
  }

  async uploadCarousel(photoPaths, caption = '') {
    return super.uploadCarousel(photoPaths, caption);
  }

  async getStories(userId) {
    return super.getStories(userId);
  }

  async uploadStory(photoPath, options = {}) {
    return super.uploadStory(photoPath, options);
  }

  async uploadVideoStory(videoPath, options = {}) {
    return super.uploadVideoStory(videoPath, options);
  }

  async deleteStory(mediaId) {
    return super.deleteStory(mediaId);
  }

  async reactToStory(userId, storyId, emoji) {
    return super.reactToStory(userId, storyId, emoji);
  }

  async getCloseFriendsStories() {
    return super.getCloseFriendsStories();
  }

  async getUserHighlights(userId) {
    return super.getUserHighlights(userId);
  }

  async getHighlightItems(highlightId) {
    return super.getHighlightItems(highlightId);
  }

  async editProfile(options = {}) {
    return super.editProfile(options);
  }

  async setProfilePicture(photoPath) {
    return super.setProfilePicture(photoPath);
  }

  async removeProfilePicture() {
    return super.removeProfilePicture();
  }

  async changePassword(oldPassword, newPassword) {
    return super.changePassword(oldPassword, newPassword);
  }

  async searchHashtags(query) {
    return super.searchHashtags(query);
  }

  async searchLocations(query) {
    return super.searchLocations(query);
  }

  async searchAll(query) {
    return super.searchAll(query);
  }

  async getNotifications() {
    return super.getNotifications();
  }

  async markNotificationsSeen() {
    return super.markNotificationsSeen();
  }

  async getFollowRequests() {
    return super.getFollowRequests();
  }

  async approveFollowRequest(userId) {
    return super.approveFollowRequest(userId);
  }

  async rejectFollowRequest(userId) {
    return super.rejectFollowRequest(userId);
  }
}

export default InstagramChatAPI;
export { InstagramChatAPI };
