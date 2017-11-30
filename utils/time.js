'use static';

exports = module.exports = {};

let sleep = async (timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};
exports.sleep = sleep;
