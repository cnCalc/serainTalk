/**
 * 规范化基础参数
 * 将传入的 object 中的所有属性由 string 转化为 int
 * 无法转换则报错
 *
 * @param {object} params 需要规范化的参数集合
 * @returns 返回转换后的参数列表
 */
let expectInt = (params) => {
  if (!params) params = {};
  for (let key in params) {
    if (!params[key]) continue;
    let tempItem = parseInt(params[key]);
    if (isNaN(tempItem)) {
      throw new Error(`${key} should could be parse to an int.`);
    } else {
      params[key] = tempItem;
    }
  };
  return params;
};

/**
 * 检车对象中的所有数组是否长度相等
 *
 * @param {any} params
 */
let expectSameLength = (params) => {
  let templen = 0;
  for (let key in params) {
    if (Array.isArray(params[key])) {
      if (!templen) templen = params[key].length;
      if (params[key].length !== templen) {
        throw new Error('need same length arrays.');
      }
    }
  }
};

/**
 * 检查指定对象中是否所有字段都不为空
 *
 * @param {any} values
 */
let expectDefined = (values) => {
  for (let key in values) {
    if (values[key] === undefined) {
      throw new Error(`lack param '${key}'`);
    }
  }
};

/**
 * 检查指定对象中是否所有字段都是数组
 *
 * @param {any} values Object<array>
 * @returns 返回转换后的参数列表
 */
let expectArray = (values) => {
  for (let key in values) {
    if (!values[key]) continue;
    if (!Array.isArray(values[key])) {
      try {
        values[key] = JSON.parse(values[key]);
        if (!Array.isArray(values[key])) {
          throw new Error();
        }
        if (values[key].length === 0) {
          delete values[key];
        }
      } catch (err) {
        throw new Error(`'${key}' must be an array`);
      }
    }
  }
  return values;
};

module.exports = {
  expectInt,
  expectSameLength,
  expectDefined,
  expectArray
};
