'use strict';

let express = require('express');
let router = express.Router();
const errorHandler = require('../utils/error-handler');
const errorMessages = require('../utils/error-messages');

router.use('/v1', require('./v1'));

router.use((err, req, res, next) => {
  return errorHandler(null, errorMessages.VALIDATION_ERROR, 400, res);
});

module.exports = router;
