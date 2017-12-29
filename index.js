'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const validation = require('express-validation');

const dbTool = require('./database');
const config = require('./config');
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

app.use(bodyParser.json());
app.use(cookieParser());
app.use(async (req, res, next) => {
  await dbTool.prepare();
  await config.prepare();
  return next();
});
app.use('/api', require('./app/router'));

// 获取静态文件
app.use(express.static('./app/public'));

app.use('/uploads', express.static('uploads', { maxAge: '7d' }));
app.get('/favicon.ico', (req, res) => {
  /* istanbul ignore next */
  res.status(404).send('undefined');
});

// 默认发送首页
app.use((req, res, next) => {
  /* istanbul ignore next */
  if (utils.env.isMocha) { return next(); }
  res.sendFile('./app/public/index.html', { root: __dirname });
});

// 数据校验禁止附带多余字段
validation.options({
  allowUnknownHeaders: false,
  allowUnknownBody: false,
  allowUnknownQuery: false,
  allowUnknownParams: false,
  allowUnknownCookies: false
});

app.listen(process.env.PORT || 8000);
console.log('API Service started on port %d', process.env.PORT || 8000);

module.exports = app;
