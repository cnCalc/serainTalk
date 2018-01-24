'use strict';

const joi = require('joi');

exports = module.exports = {};

let verify = {
  body: joi.object({
    name: joi.string().required(),
    password: joi.string(),
    email: joi.string().email(),
  }).and('password', 'email'),
};
exports.verify = verify;

let perform = {
  body: {
    name: joi.string().required(),
    newname: joi.string().required(),
    newpassword: joi.string().required().required(),
    token: joi.string().required(),
  },
};
exports.perform = perform;
