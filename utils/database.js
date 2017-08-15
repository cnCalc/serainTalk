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
};

mongoConnect();

module.exports = {
  get db () {
    return _db;
  },
  prepare
};
