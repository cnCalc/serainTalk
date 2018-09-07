'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const validation = require('express-validation');

const config = require('../config');
const dbTool = require('../database');
const routeConfig = require('../config/route');

const middleware = require('./middleware');
const { log, cache, pretreatment } = middleware;
const utils = require('../utils');
const { errorHandler, errorMessages, logger } = utils;

let router = express.Router();

// 数据预处理
router.use(bodyParser.json());
router.use(cookieParser());
router.use(async (req, res, next) => {
  await dbTool.prepare();
  await config.prepare();
  return next();
});
router.use(pretreatment.getMemberInfo);
router.use(pretreatment.getPermissions);

// 日志-输出到控制台
router.use(log.consoleMiddleware);
router.use(cache.disableCache);

// 根据路由表批量添加路由
for (let routeType of Object.keys(routeConfig)) {
  for (let routeName of Object.keys(routeConfig[routeType])) {
    try {
      let route = routeConfig[routeType][routeName];
      let handler = route.handler.pop();
      route.handler.push(validation(route.schema));
      router[route.method](route.path, ...route.handler, handler);
    } catch (err) {
      /* istanbul ignore next */
      logger.writeInfoLog({ entity: 'router', content: `${routeType}-${routeName} has some problem.` });
      /* istanbul ignore next */
      throw err;
    }
  }
}

// 未通过验证的错误处理
router.use((err, req, res, next) => {
  /* istanbul ignore else */
  if (err.message === 'validation error') {
    /* istanbul ignore next */
    if (!utils.env.isProd) console.error(JSON.stringify(err, null, '  '));
    return errorHandler(null, errorMessages.VALIDATION_ERROR, 400, res);
  } else {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
});

module.exports = router;
