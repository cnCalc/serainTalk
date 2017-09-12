'use strict';

const { ObjectID } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const utils = require('../../utils');
const MD5 = utils.md5;

let router = express.Router();

/**
 * 使用原始配置重置配置信息
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let resetSettings = async (req, res, next) => {
  try {
    let setting = await config.discussion.reset();
    res.status(201).send({ status: 'ok', setting: setting });
  } catch (err) {
    errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

// TODO
// let setSettings = async (req, res, next) => {

// };

router.post('/discussion/reset', utils.middleware.verifyAdmin, resetSettings);
// router.post('/', utils.middleware.verifyAdmin, setSettings);

module.exports = router;
