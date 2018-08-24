'use strict';

/**
 * 处理已经遇到的错误
 *
 * @param {*} err 抛出的异常内容
 * @param {*} info 异常信息
 * @param {*} code HTTP 响应状态吗
 * @param {*} res HTTP 响应对象
 */
function errorHandler (err, info, code, res) {
  /* istanbul ignore if */
  if (err) console.error(err);

  /* istanbul ignore else */
  if (res) {
    code && res.status && res.status(code);
    res.send({
      status: 'error',
      message: info ? info.message : undefined,
      code: info ? info.code : undefined,
    });
  }
}

module.exports = errorHandler;
