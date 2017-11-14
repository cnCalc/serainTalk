'use strict';

let express = require('express');
let router = express.Router();
const errorHandler = require('../utils/error-handler');
const errorMessages = require('../utils/error-messages');

router.use('/v1', require('./v1'));

router.use((err, req, res, next) => {
  if (err.message === 'validation error') {
    return errorHandler(null, errorMessages.VALIDATION_ERROR, 400, res);
  } else {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
});

module.exports = router;
