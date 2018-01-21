'use strict';

const express = require('express');
const path = require('path');
const validation = require('express-validation');

const staticConfig = require('./config/staticConfig');
const utils = require('./utils');

const app = express();

/* istanbul ignore if */
if (utils.env.isDev) {
  console.log('You are running in development mode. Access-Control-Allow-Origin will always be *.');
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    return next();
  });
}

// 获取 favicon
app.get('/favicon.ico', (req, res) => {
  /* istanbul ignore next */
  res.status(404).send('undefined');
});
// 获取静态文件
app.use('/uploads/avatar', express.static(staticConfig.upload.avatar.path));
app.use('/picture', express.static(staticConfig.upload.picture.path));
app.use(express.static(staticConfig.frontEnd.filePath));

// 处理请求
app.use('/api', require('./app/router'));

// TODO: file 需要单独鉴权
app.use('/uploads', express.static(
  staticConfig.upload.file.path,
  { maxAge: staticConfig.upload.file.maxAge }
));

// 默认发送首页
app.use((req, res, next) => {
  /* istanbul ignore next */
  if (utils.env.isMocha) { return next(); }
  res.sendFile(path.join(staticConfig.frontEnd.filePath, 'index.html'));
});

// 数据校验禁止附带多余字段
validation.options({
  allowUnknownHeaders: false,
  allowUnknownBody: false,
  allowUnknownQuery: false,
  allowUnknownParams: false,
  allowUnknownCookies: false,
});

app.listen(process.env.PORT || 8000);
console.log('API Service started on port %d', process.env.PORT || 8000);

module.exports = app;
