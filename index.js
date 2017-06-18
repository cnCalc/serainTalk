'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

if (process.env.DEV) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
}

app.use(cookieParser());

app.use(require('./utils/log'));
app.use('/api', require('./handlers/index'));

app.use('/uploads', express.static('uploads', { maxAge: '7d' }));
app.use(express.static('web'));
app.use((req, res) => {
  res.sendfile('./web/index.html');
});

app.listen(process.env.PORT || 8000);
console.log('API Service started on port %d', process.env.PORT || 8000);
