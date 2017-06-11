'use strict';

function errorHandler (err, message, code, res) {
  err && console.error(err);
  if (res) {
    code && res.status && res.status(code);
    res.send({
      status: 'error',
      message,
    });
  }
}

module.exports = errorHandler;
