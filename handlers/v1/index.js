'use strict';

const express = require('express');
const utils = require('../../utils');

let router = express.Router();

router.use(utils.middleware.disableCache);
router.use(utils.middleware.getUserInfo);
router.use(utils.middleware.sortData);

router.use('/member', require('./member'));
router.use('/attachment', require('./attachment'));
router.use(/\/categor(ies|y)/, require('./category'));
router.use(/\/discussion[s]{0,1}/, require('./discussion'));
router.use('/tags', require('./tags'));
router.use('/migration', require('./migration'));

module.exports = router;
