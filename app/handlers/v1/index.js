'use strict';

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

module.exports = {
  member: require('./member'),
  attachment: require('./attachment'),
  category: require('./category'),
  discussion: require('./discussion'),
  tag: require('./tags'),
  migration: require('./migration'),
  setting: require('./settings'),
  message: require('./message'),
  notification: require('./notification'),
  debug: require('./debug'),
};
