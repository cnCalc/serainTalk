'use strict';

const { ObjectID } = require('mongodb');

const dbTool = require('../../../database');

let uploadPicture = async (req, res, next) => {
  let picture = {
    _id: new ObjectID(),
    _owner: req.member._id,
    type: 'image',
    fileName: req.file.originalname,
    filePath: req.file.path,
    size: req.file.size,
    status: 'ok',
    referer: [],
  };
  await dbTool.attachment.insertOne(picture);

  // 对成员隐藏路径信息
  delete picture.filePath;
  return res.status(201).send({ status: 'ok', picture: picture });
};

module.exports = {
  uploadPicture: uploadPicture,
};
