'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

let _db = null;

let mongoConnect = async () => {
  let db;
  try {
    db = await MongoClient.connect(config.database);
  } catch (err) {
    console.error(err);
    process.exit(10);
  }
  _db = db;
};

let prepare = async () => {
  if (_db) return;
  await mongoConnect();
  console.info('database connected.');

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

  prepare
};
