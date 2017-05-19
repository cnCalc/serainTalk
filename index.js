'use strict';

const express = require('express');

const app = express();

if (process.env.DEV) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
}

app.use(require('./utils/log'));

app.get('/', (req, res) => {
  res.send({
    status: 'ok'
  });
});

require('./handlers/index')(app);

app.listen(process.env.PORT || 8000);
console.log('API Service started on port %d', process.env.PORT || 8000);
