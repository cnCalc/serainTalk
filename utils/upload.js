'use strict';

const multer = require('multer');
const staticConfig = require('../config/staticConfig');
const randomString = require('./random-string');

const fileUpload = multer({
  storage: multer.diskStorage({
    destination: staticConfig.upload.file.path,
    filename (req, file, cb) {
      var fileFormat = (file.originalname).split('.');
      var extName = fileFormat.length === 1 ? '' : '.' + fileFormat[fileFormat.length - 1];
      if (req.member.id) cb(null, `${req.member.id}-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
      else cb(null, `unknown-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
    },
    fieldname: 'file',
  }),
  limits: { fileSize: staticConfig.upload.file.maxSize },
});

const pictureUpload = multer({
  storage: multer.diskStorage({
    destination: staticConfig.upload.picture.path,
    filename (req, file, cb) {
      var fileFormat = (file.originalname).split('.');
      var extName = fileFormat.length === 1 ? '' : '.' + fileFormat[fileFormat.length - 1];
      if (req.member.id) cb(null, `${req.member.id}-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
      else cb(null, `unknown-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
    },
    fieldname: 'picture',
  }),
  limits: { fileSize: staticConfig.upload.picture.maxSize },
  fileFilter (req, file, cb) {
    if (!/(gif|bmp|webp|png|jpeg|svg)/i.test(file.mimetype)) {
      cb(new Error('don\'t support type'));
      return;
    }
    cb(null, true);
  },
});

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: staticConfig.upload.avatar.path,
    filename (req, file, cb) {
      var fileFormat = (file.originalname).split('.');
      var extName = fileFormat.length === 1 ? '' : '.' + fileFormat[fileFormat.length - 1];
      if (req.member.id) cb(null, `${req.member.id}-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
      else cb(null, `unknown-${Date.now()}-${randomString()}-${file.fieldname}${extName}`);
    },
    fieldname: 'avatar',
  }),
  limits: { fileSize: staticConfig.upload.picture.maxSize },
  fileFilter (req, file, cb) {
    if (!/(gif|bmp|webp|png|jpeg|svg)/i.test(file.mimetype)) {
      cb(new Error('don\'t support type'));
      return;
    }
    cb(null, true);
  },
});

module.exports = {
  avatarUpload: avatarUpload,
  fileUpload: fileUpload,
  pictureUpload: pictureUpload,
};
