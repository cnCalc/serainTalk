'use strict';

let parseCookie = (cookieString = '') => {
  let cookies = {};
  let cookieList = cookieString.split(';');
  cookieList.forEach((cookie) => {
    cookie = cookie.split('=');
    cookies[cookie[0]] = cookie[1] ? cookie[1] : '';
  });
  return cookies;
};
exports.parse = parseCookie;
