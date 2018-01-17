'use static';

let config = require('../config');
let env = require('./env');

exports = module.exports = {};

let checkPermission = async (permissionName, memberPermissionList) => {
  await config.prepare();

  let permission = permissionName.split('-');
  if (typeof memberPermissionList === 'undefined') {
    memberPermissionList = [];
  }

  const r = config.permissions[permission[0]][permission[1]].enable
    && memberPermissionList.includes(permissionName);
  if (env.isDev && !r) {
    console.warn(`${permissionName} is not permitted to the member of this request.`);
  }

  return r;
};
exports.checkPermission = checkPermission;
