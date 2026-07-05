'use strict';

const loginNkxica = require('@neoaz07/nkxica').login;
const loginFca = require('../instagram-fca/login-wrapper');
const fs = require('fs-extra');
const logger = require('../../utils/logger');

/**
 * Handles the multi-layered login process for Instagram
 * @param {Object} config Bot configuration
 * @returns {Promise<Object>} Object containing nkxica and/or fca instances
 */
async function loginIG(config) {
    let credentials = config.ACCOUNT_COOKIES;

    if (!credentials && fs.existsSync(config.ACCOUNT_FILE)) {
        credentials = fs.readFileSync(config.ACCOUNT_FILE, 'utf-8');
    }

    if (!credentials && config.ACCOUNT_EMAIL && config.ACCOUNT_PASSWORD) {
        credentials = {
            email: config.ACCOUNT_EMAIL,
            password: config.ACCOUNT_PASSWORD,
            twoFactorSecret: config.ACCOUNT_2FA_SECRET
        };
    }

    if (!credentials) {
        throw new Error('No credentials found. Please provide IG_COOKIES or set up account.txt / EMAIL & PASSWORD.');
    }

    let nkxica = null;
    let fca = null;

    logger.info('Logging in with nkxica (Primary)...');
    try {
        nkxica = await loginNkxica(credentials);
        logger.success('nkxica login successful');
    } catch (e) {
        logger.error('nkxica login failed', { error: e.message });
        logger.info('Attempting login with Instagram-FCA (Fallback)...');
        try {
            fca = await loginFca(credentials, config.OPTIONS_FCA);
            logger.success('Instagram-FCA login successful');
        } catch (fcaErr) {
            logger.error('Instagram-FCA login failed', { error: fcaErr.message });
            throw e;
        }
    }

    if (config.EXPERIMENTAL_FCA_ENABLE && !fca) {
        try {
            logger.info('Logging in with Instagram-FCA (Secondary)...');
            fca = await loginFca(credentials, config.OPTIONS_FCA);
            logger.success('Instagram-FCA login successful');
        } catch (e) {
            logger.warn('Instagram-FCA login failed, continuing with nkxica only.');
        }
    }

    return { nkxica, fca };
}

module.exports = loginIG;
