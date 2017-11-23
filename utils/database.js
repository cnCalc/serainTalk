'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

// 真实的连接对象
let _db = null;

/**
 * 连接到数据库，并将连接保存到 _db 中
 */
let mongoConnect = async () => {
  let db;
  try {
    db = await MongoClient.connect(config.database);
  } catch (err) {
    /* istanbul ignore next */
    console.error(err);
    /* istanbul ignore next */
    process.exit(10);
  }
  _db = db;
};

let prepare = async () => {
  if (_db) return;
  await mongoConnect();
  console.log('database connected.');

  exports.generic = _db.collection('generic');
  exports.discussion = _db.collection('discussion');
  exports.attachment = _db.collection('attachment');
  exports.commonMember = _db.collection('common_member');
  exports.mail = _db.collection('mail');
  exports.temppost = _db.collection('temppost');
  exports.config = _db.collection('config');
};

mongoConnect();

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

  prepare
};
