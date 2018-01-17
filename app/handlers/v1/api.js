'use strict';

const convert = require('joi-to-json-schema');
const joi = require('joi');
let buffer;

let listApi = async (req, res, next) => {
  if (buffer) {
    return res.status(200).send({ status: 'ok', apis: buffer });
  }
  let route = require('../../../config/route');
  let tempBuffer = {};
  for (let routeCategory of Object.keys(route)) {
    tempBuffer[routeCategory] = {};
    for (let routeName of Object.keys(route[routeCategory])) {
      let routeDetails = route[routeCategory][routeName];

      // 生成 json 格式的输入模型
      let jsonSchema = routeDetails.schema;
      try {
        JSON.stringify(routeDetails.schema);
      } catch (err) {
        let tempSchema = joi.object(routeDetails.schema);
        jsonSchema = convert(tempSchema);
      }

      // 将正则路由转换为 json 格式
      let jsonPath = [];
      for (let path of routeDetails.path) {
        if (typeof path !== 'string') {
          path = path.toString();
        }
        jsonPath.push(path);
      }

      tempBuffer[routeCategory][routeName] = {
        description: routeDetails.description,
        method: routeDetails.method,
        route: jsonPath,
        schema: jsonSchema,
      };
    }
  }
  buffer = tempBuffer;
  try {
    res.status(200).send({ status: 'ok', apis: buffer });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  listApi,
};
