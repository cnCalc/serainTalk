'use strict';

const express = require('express');

const { cache, pretreatment, environment } = require('../../middleware');

let router = express.Router();

router.use(cache.disableCache);
router.use(pretreatment.getMemberInfo);

router.use(['/member', '/members'], require('./member'));
router.use('/attachment', require('./attachment'));
router.use(['/categories', '/category'], require('./category'));
router.use(['/discussion', '/discussions'], require('./discussion'));
router.use('/tags', require('./tags'));
router.use('/migration', require('./migration'));
router.use(['/settings', '/setting'], require('./settings'));
router.use(['/message', '/messages'], require('./message'));
router.use(['/notification', '/notifications'], require('./notification'));
router.use('/debug', environment.checkEnv, require('./debug'));

module.exports = router;
