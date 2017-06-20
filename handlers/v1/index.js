'use strict';

const express = require('express');
const discussionHandlers = require('./discussion');
const tagsHandlers = require('./tags');
const categoryHandlers = require('./category');
const attachmentHandlers = require('./attachment');
const utils = require('../../utils');

let router = express.Router();

let handlers = [
  ...discussionHandlers.handlers,
  ...tagsHandlers.handlers,
  ...categoryHandlers.handlers,
  ...attachmentHandlers.handlers,
];

router.use(utils.middleware.getUserInfo);
router.use(utils.middleware.sortData);

router.use('/member', require('./member'));

router.use((req, res, next) => {
  res.header('cache-control', 'no-cache');
  res.header('pragma', 'no-cache');
  res.header('expires', '0');
  next();
});

handlers.forEach(handler => {
  ['get', 'post', 'put', 'delete'].forEach(method => {
    if (handler[method]) {
      router[method](`/${handler.path}`, handler[method]);
    }
  });
});

module.exports = router;
