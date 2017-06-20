'use strict';

let express = require('express');
let router = express.Router();

router.use('/v1', require('./v1'));

module.exports = router;
