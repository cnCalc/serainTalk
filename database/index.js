'use strict';

const { MongoClient } = require('mongodb');
const _ = require('lodash');

// 获取数据库相关的静态数据
const config = require('../config/staticConfig');
const dev = require('../config/dev');
const product = require('../config/product');
const mocha = require('../config/mocha');
const env = require('../utils/env');
const logger = require('../utils/logger');

if (env.isProd) {
  _.merge(config, product);
} else if (env.isMocha) {
  _.merge(config, mocha);
} else {
  _.merge(config, dev);
}

// 真实的连接对象
let _db = null;

/**
 * 连接到数据库，并将连接保存到 _db 中
 */
let mongoConnect = async () => {
  try {
    _db = (await MongoClient.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true })).db(config.databaseName);
    if (env.isMocha) await _db.dropDatabase();

    logger.writeInfoLog({ entity: 'Database', content: 'Database connected.' });
  } catch (err) {
    /* istanbul ignore next */
    console.error(err);
    /* istanbul ignore next */
    process.exit(10);
  }
};
let connection = mongoConnect();

/**
 * 等待数据库初始化完毕
 *
 */
let prepare = async () => {
  /* istanbul ignore else */
  if (!_db) await connection;
};

/**
 * @typedef {import('mongodb').Collection} Collection
 * @type {Object.<string, Collection>}
 */
exports = module.exports = new Proxy({
  get db () {
    return _db;
  },
  prepare,
}, {
  get (object, prop) {
    if (prop in object) {
      return object[prop];
    }

    return _db.collection(prop.replace(/([A-Z])/g, '_$1').toLowerCase());
  },
});
