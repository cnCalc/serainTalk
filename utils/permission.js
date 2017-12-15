'use static';

let config = require('../config');

exports = module.exports = {};

let checkPermission = async (permissionName, memberPermissionList) => {
  await config.prepare();

  let permission = permissionName.split('-');
  return config.permissions[permission[0]][permission[1]].enable &&
    memberPermissionList.includes(permissionName);
};
exports.checkPermission = checkPermission;
