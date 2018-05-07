let promisify = (original) => {
  return (...params) => {
    return new Promise((resolve, reject) => {
      original(...params, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  };
};

module.exports = promisify;
