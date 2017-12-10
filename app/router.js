'use strict';

let express = require('express');
const validation = require('express-validation');

const middleware = require('./middleware');
const routeConfig = require('../config/route');
const { log, cache, pretreatment } = middleware;
const { errorHandler, errorMessages } = require('../utils');

let router = express.Router();

// 日志-输出到控制台
router.use(log.consoleMiddleware);
router.use(cache.disableCache);
router.use(pretreatment.getMemberInfo);
router.use(pretreatment.getPermissions);

// 根据路由表批量添加路由
for (let routeType of Object.keys(routeConfig)) {
  for (let routeName of Object.keys(routeConfig[routeType])) {
    let route = routeConfig[routeType][routeName];
    let handler = route.handler.pop();
    route.handler.push(validation(route.schema));
    router[route.method](route.path, ...route.handler, handler);
  }
}

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
