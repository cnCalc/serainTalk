'use strict';

/**
 * 处理已经遇到的错误
 *
 * @param {*} err 抛出的异常内容
 * @param {*} message 异常的说明文本
 * @param {*} code HTTP 响应状态吗
 * @param {*} res HTTP 响应对象
 */
function errorHandler (err, message, code, res) {
  /* istanbul ignore if */
  if (err) console.error(err);

  /* istanbul ignore else */
  if (res) {
    code && res.status && res.status(code);
    res.send({
      status: 'error',
      message,
    });
  }
}

module.exports = errorHandler;
