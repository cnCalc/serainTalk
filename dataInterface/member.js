'use strict';

const joi = require('joi');
const config = require('../config');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let signup = {
  body: {
    username: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().email().required(),

    gender: joi.number(),
    birthyear: joi.number(),
    birthmonth: joi.number(),
    birthday: joi.number(),
    address: joi.string(),
    qq: joi.string(),
    site: joi.string(),
    bio: joi.string(),
    regip: joi.string(),
    regdate: joi.number(),
    secques: joi.string(),
    device: joi.string()
  }
};
exports.signup = signup;
