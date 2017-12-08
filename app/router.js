'use strict';

let express = require('express');

const log = require('./middleware/log');
const { errorHandler, errorMessages } = require('..//utils');

let router = express.Router();

// 日志-输出到控制台
router.use(log.consoleMiddleware);

router.use('/api', require('./handlers'));
router.use(express.static('public'));

// 默认发送首页
router.use((req, res) => {
  /* istanbul ignore next */
  res.sendFile('./public/index.html', { root: __dirname });
});
// 未通过验证的错误处理
router.use((err, req, res, next) => {
  /* istanbul ignore else */
  if (err.message === 'validation error') {
    /* istanbul ignore if */
    if (process.env.NODE_ENV === 'DEV') console.error(JSON.stringify(err, null, '  '));
    return errorHandler(null, errorMessages.VALIDATION_ERROR, 400, res);
  } else {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
});

module.exports = router;
