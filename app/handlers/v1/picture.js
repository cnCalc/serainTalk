'use strict';

let uploadPicture = (req, res, next) => {
  return res.status(201).send({ status: 'ok', pictureName: req.file.filename });
};

module.exports = {
  uploadPicture: uploadPicture,
};
