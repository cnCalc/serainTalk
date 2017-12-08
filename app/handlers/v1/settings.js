'use strict';

const express = require('express');

const config = require('../../../config');
const utils = require('../../../utils');
const { verifyAdmin } = require('../../middleware').permission;
const { errorHandler, errorMessages } = utils;

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

// TODO:
// let setSettings = async (req, res, next) => {

// };

router.post('/discussion/reset', verifyAdmin, resetSettings);
// router.post('/', utils.middleware.verifyAdmin, setSettings);

module.exports = router;
