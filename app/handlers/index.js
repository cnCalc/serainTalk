'use strict';

let express = require('express');
let router = express.Router();
const { errorHandler, errorMessages } = require('../../utils');

router.use('/v1', require('./v1'));

router.use((err, req, res, next) => {
  /* istanbul ignore else */
  if (err.message === 'validation error') {
    /* istanbul ignore if */
    if (process.env.NODE_ENV === 'DEV') console.error(JSON.stringify(err, null, '  '));
    return errorHandler(null, errorMessages.VALIDATION_ERROR, 400, res);
  } else {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
});

module.exports = router;
