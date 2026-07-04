/**
 * @module api/profile
 * Profile management — edit, set picture, remove picture, change password.
 *
 * @author NeoKEX (https://github.com/NeoKEX)
 * @license MIT
 */

import { readFileSync } from 'fs';
import sharp  from 'sharp';
import logger from '../Logger.js';

export class ProfileAPI {
  constructor(ig) {
    this.ig = ig;
  }

  async editProfile(options = {}) {
    try {
      const current = await this.ig.account.currentUser();
      const cur     = current;

      const payload = {
        username:     options.username  ?? current.username,
        first_name:   options.name ?? options.fullName ?? current.full_name,
        biography:    options.biography ?? options.bio ?? cur['biography'] ?? '',
        email:        options.email     ?? cur['email']        ?? '',
        phone_number: options.phone     ?? cur['phone_number'] ?? '',
        external_url: options.website ?? options.externalUrl ?? cur['external_url'] ?? '',
        gender:       options.gender    ?? cur['gender']       ?? 1,
      };

      const result = await this.ig.account.editProfile(payload);

      logger.success('Profile updated');
      return result;
    } catch (error) {
      logger.error('Failed to edit profile:', error.message);
      throw new Error(`Failed to edit profile: ${error.message}`);
    }
  }

  async setProfilePicture(photoPath) {
    try {
      const raw = readFileSync(photoPath);
      let picture = raw;
      try {
        picture = Buffer.from(await sharp(picture).resize(320, 320, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer());
      } catch { /* ignore */ }

      const result = await this.ig.account.changeProfilePicture({ picture });

      logger.success('Profile picture updated');
      return result;
    } catch (error) {
      logger.error('Failed to set profile picture:', error.message);
      throw new Error(`Failed to set profile picture: ${error.message}`);
    }
  }

  async removeProfilePicture() {
    try {
      await this.ig.account.removeProfilePicture();
      logger.success('Profile picture removed');
    } catch (error) {
      logger.error('Failed to remove profile picture:', error.message);
      throw new Error(`Failed to remove profile picture: ${error.message}`);
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      await this.ig.account.changePassword(oldPassword, newPassword);
      logger.success('Password changed');
    } catch (error) {
      logger.error('Failed to change password:', error.message);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }
}
