'use strict';

const discussionHandlers = require('./discussion');
const tagsHandlers = require('./tags');
const memberHandlers = require('./member');
const categoryHandlers = require('./category');

function handlersInstaller(app) {
  let handlers = [
    ...discussionHandlers.handlers, 
    ...tagsHandlers.handlers,
    ...memberHandlers.handlers,
    ...categoryHandlers.handlers,
  ];

  handlers.forEach(handler => {
    ['get', 'post', 'put', 'delete'].forEach(method => {
      if (handler[method]) {
        app[method](`/api/v1${handler.path}`, handler[method]);
      }
    });
  });
}

module.exports = handlersInstaller;