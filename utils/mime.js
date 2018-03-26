const mmm = require('mmmagic');
const Magic = mmm.Magic;
const magic = new Magic(mmm.MAGIC_MIME_TYPE);

function getMIME (filepath) {
  return new Promise((resolve, reject) => {
    magic.detectFile(filepath, (err, res) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(res);
      }
    })
  });
}

module.exports = { getMIME };
