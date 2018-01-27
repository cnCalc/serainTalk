'use strict';

const joi = require('joi');

exports = module.exports = {};

let verify = {
  body: joi.object({
    name: joi.string().required(),
    password: joi.string(),
    email: joi.string().email(),
    code: joi.string(),
  }).and('password', 'email'),
};
exports.verify = verify;

let perform = {
  body: {
    name: joi.string().required(),
    newname: joi.string(),
    newpassword: joi.string().required().required(),
    token: joi.string().required(),
  },
};
exports.perform = perform;
