'use strict';

exports = module.exports = {};

let routeCompare = (routeA, routeB) => {
  // 请求方式不同按请求方式的字母序排序
  if (routeA.method !== routeB.method) return routeA.method > routeB.method ? 1 : -1;

  let isRegExpA = routeA.path instanceof RegExp;
  let isRegExpB = routeB.path instanceof RegExp;

  // 有一方是正则的情况下，正常路径比正则路径优先加载
  if (isRegExpA && !isRegExpB) return 1;
  if (!isRegExpA && isRegExpB) return -1;

  let getArrayPath = (path) => {
    if (path instanceof RegExp) return path.toString().slice(1, -1).split('\\/');
    if (typeof path === 'string') return path.toString().split('\/');

    // TODO: 规范化错误文本
    throw new Error(`路由只接受字符串或正则，传入的${path}是不合法的。`);
  };

  let arrayPathA = getArrayPath(routeA.path);
  let arrayPathB = getArrayPath(routeB.path);

  let lengthA = arrayPathA.length;
  let lengthB = arrayPathB.length;

  // 同为字符串或正则时路径层数多的优先加载
  if (lengthA !== lengthB) return lengthB - lengthA;

  let isRegParams = (route) => {
    return route.slice(0, 1) === '(' && route.slice(-1) === ')';
  };

  let isStringParams = (route) => {
    return route.slice(0, 1) === ':';
  };

  // 根据路径类型选择对应的鉴别参数的方法
  let checkFunction = isRegExpA ? isRegParams : isStringParams;

  for (let i = 0; i < lengthA; i++) {
    // 将固定值的路由提到参数路由之前
    if (checkFunction(arrayPathA[i]) && !checkFunction(arrayPathB[i])) return 1;
    if (!checkFunction(arrayPathA[i]) && checkFunction(arrayPathB[i])) return -1;

    // 两个都是参数时，忽略参数名的不同，向下检查
    if (checkFunction(arrayPathA[i]) && checkFunction(arrayPathB[i])) continue;

    // 不同时两个路由按字母序排序。
    if (arrayPathA[i] !== arrayPathB[i]) return arrayPathA[i] > arrayPathB[i] ? 1 : -1;
  }

  // TODO: 规范化错误文本
  throw new Error(`${routeA.description}\n${routeB.description}\n这两个路由是完全相同的。`);
};
exports.routeCompare = routeCompare;
