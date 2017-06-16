'use strict';

const express = require('express');
const discussionHandlers = require('./discussion');
const tagsHandlers = require('./tags');
const memberHandlers = require('./member');
const categoryHandlers = require('./category');
const attachmentHandlers = require('./attachment');

let router = express.Router();

let handlers = [
  ...discussionHandlers.handlers,
  ...tagsHandlers.handlers,
  ...memberHandlers.handlers,
  ...categoryHandlers.handlers,
  ...attachmentHandlers.handlers,
];

router.use((req, res, next) => {
  res.header('cache-control', 'no-cache');
  res.header('pragma', 'no-cache');
  res.header('expires', '0');
  next();
});

handlers.forEach(handler => {
  ['get', 'post', 'put', 'delete'].forEach(method => {
    if (handler[method]) {
      router[method](`/v1${handler.path}`, handler[method]);
    }
  });
});

module.exports = router;
