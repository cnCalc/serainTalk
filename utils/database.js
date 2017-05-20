'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

let _db = null;

MongoClient.connect(config.database, (err, db) => {
  if (err) {
    console.error(err);
    process.exit(10);
  } else {
    _db = db;
  }
});

module.exports = {
  get db () {
    return _db;
  }
};
