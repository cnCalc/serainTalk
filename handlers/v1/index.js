'use strict';

const express = require('express');
const utils = require('../../utils');

let router = express.Router();

router.use(utils.middleware.disableCache);
router.use(utils.middleware.getMemberInfo);
router.use(utils.middleware.sortData);

router.use(['/member', '/members'], require('./member'));
router.use('/attachment', require('./attachment'));
router.use(['/categories', '/category'], require('./category'));
router.use(['/discussion', '/discussions'], require('./discussion'));
router.use('/tags', require('./tags'));
router.use('/migration', require('./migration'));

module.exports = router;
