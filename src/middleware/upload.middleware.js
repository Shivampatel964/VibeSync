'use strict';

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/env');
const { AppError } = require('../utils/response.utils');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = config.upload.maxFileSizeMb * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.upload.dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(
      new AppError(`Invalid file type: ${file.mimetype}. Only images allowed.`, 415),
      false
    );
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});

/**
 * Single image upload: field name 'image'
 */
const uploadSingleImage = upload.single('image');

/**
 * Single avatar upload: field name 'avatar'
 */
const uploadAvatar = upload.single('avatar');

/**
 * Build the public URL path for a stored file.
 * @param {string|undefined} filename
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function buildFileUrl(filename, req) {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
}

module.exports = { uploadSingleImage, uploadAvatar, buildFileUrl };