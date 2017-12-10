'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let verify = {
  body: {
    name: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().email().required()
  }
};
exports.verify = verify;

let perform = {
  name: joi.string().required(),
  password: joi.string().required(),
  token: joi.string().required()
};
exports.perform = perform;
