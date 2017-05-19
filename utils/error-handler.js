'use strict';

function errorHandler (err, message, code, res) {
  err && console.error(err);
  if (res) {
    code && res.code(code);
    res.send({
      status: 'error',
      message,
    });
  }
}

module.exports = errorHandler;
