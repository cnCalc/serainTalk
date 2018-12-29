'use strict';

const express = require('express');
const path = require('path');
const validation = require('express-validation');
const childProcess = require('child_process');
const fs = require('fs');

const staticConfig = require('./config/staticConfig');
const utils = require('./utils');
const router = require('./app/router');

// promise 错误直接抛出
process.on('unhandledRejection', (error, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', error);
  process.exit(1);
});

const app = express();

/* istanbul ignore if */
if (utils.env.isDev) {
  utils.logger.writeInfoLog({ entity: 'Server', content: 'You are running in development mode. Access-Control-Allow-Origin will always be *.' });
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    return next();
  });
}

// 听说这样安全一点……？
app.disable('x-powered-by');

// 获取 favicon
app.get('/favicon.ico', (req, res) => {
  /* istanbul ignore next */
  res.status(404).send('undefined');
});
// 获取静态文件
app.use('/avatar', express.static(staticConfig.upload.avatar.path));
app.use('/picture', express.static(staticConfig.upload.picture.path));
app.use(express.static(staticConfig.frontEnd.filePath));

// 处理请求
app.use('/api', router);

// TODO: file 需要单独鉴权
app.use('/uploads', express.static(
  staticConfig.upload.file.path,
  { maxAge: staticConfig.upload.file.maxAge }
));

// 数据校验禁止附带多余字段
validation.options({
  allowUnknownHeaders: false,
  allowUnknownBody: false,
  allowUnknownQuery: false,
  allowUnknownParams: false,
  allowUnknownCookies: false,
});

// 初始化 websocket
const server = utils.websocket.attachSocketIO(app).server;

let listenPromise = new Promise((resolve, reject) => {
  server.listen(process.env.PORT || 8000, () => {
    resolve();
    utils.logger.writeInfoLog({ entity: 'Server', content: `API Service started on port ${process.env.PORT || 8000}` });
  });
});
app.prepare = async () => await listenPromise;

module.exports = app;

