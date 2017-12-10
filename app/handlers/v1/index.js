'use strict';

// router.use(['/member', '/members'], require('./member'));
// router.use('/attachment', require('./attachment'));
// router.use(['/categories', '/category'], require('./category'));
// router.use(['/discussion', '/discussions'], require('./discussion'));
// router.use('/tags', require('./tags'));
// router.use('/migration', require('./migration'));
// router.use(['/settings', '/setting'], require('./settings'));
// router.use(['/message', '/messages'], require('./message'));
// router.use(['/notification', '/notifications'], require('./notification'));
// router.use('/debug', environment.checkEnv, require('./debug'));

module.exports = {
  attachment: require('./attachment'),
  category: require('./category'),
  debug: require('./debug'),
  discussion: require('./discussion'),
  member: require('./member'),
  message: require('./message'),
  migration: require('./migration'),
  notification: require('./notification'),
  setting: require('./settings'),
  tags: require('./tags'),
};
