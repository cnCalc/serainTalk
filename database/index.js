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
    _db = (await MongoClient.connect(config.database)).db(config.databaseName);
    if (env.isMocha) await _db.dropDatabase();

    exports.generic = _db.collection('generic');
    exports.discussion = _db.collection('discussion');
    exports.attachment = _db.collection('attachment');
    exports.commonMember = _db.collection('common_member');
    exports.mail = _db.collection('mail');
    exports.temppost = _db.collection('temppost');
    exports.config = _db.collection('config');
    exports.message = _db.collection('message');
    exports.token = _db.collection('token');

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

exports = module.exports = {
  get db () {
    return _db;
  },

  generic: 'loading',
  discussion: 'loading',
  attachment: 'loading',
  commonMember: 'loading',
  mail: 'loading',
  temppost: 'loading',
  config: 'loading',
  message: 'loading',
  token: 'loading',

  prepare,
};
