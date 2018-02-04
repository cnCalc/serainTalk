'use strict';

const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');

const staticConfig = require('../../config/staticConfig');
const errorMessage = require('../../utils/error-messages');
const app = require('../..');
const server = require('http').Server(app);
const io = require('socket.io')(server);

exports = module.exports = {};

let connections = {};
exports.connections = connections;

io.sockets.on('connection', function (socket) {
  // 初始化 socket
  socket.on('init', function (token) {
    let member;
    try {
      member = jwt.verify(token, staticConfig.jwtSecret);
      member.id = member._id;
      member._id = ObjectID(member.id);
      // 缓存 socket
      socket.member = member.id;
      connections[member.id] = socket;
    } catch (err) {
      socket.emit('error', { status: 'error', event: 'init', message: errorMessage.NEED_LOGIN });
    }
  });

  // 断开连接
  socket.on('disconnect', function () {
    // 删除链接缓存
    if (connections[socket.member]) {
      delete connections[socket.member];
    }
  });

  // 心跳包（待定）
  socket.on('heartbeat', function (data) {
  });
});
