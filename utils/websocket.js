'use strict';

const socket = require('socket.io');
const http = require('http');
const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const staticConfig = require('../config/staticConfig');
// const errorMessage = require('./error-messages');
const dbTool = require('../database');
const logger = require('./logger');

exports = module.exports = {};

let server, io, connections;

function attachSocketIO (app) {
  if (app) {
    server = http.Server(app);
    io = socket(server, { path: '/api/ws' });
    connections = {
      visitor: [],
    };

    io.on('connection', async socket => {
      let member;
      let token = socket.handshake.query.token;
      try {
        let payload = jwt.verify(token, staticConfig.jwtSecret);
        member = await dbTool.commonMember.findOne({ _id: ObjectID(payload.id) });
        member.id = member._id;
        socket.member = member.id;
      } catch (err) {
        member = { id: 'visitor' };
        // socket.emit('failure', { status: 'error', message: errorMessage.NEED_LOGIN, code: 'NEED_LOGIN' });
        // return socket.disconnect();
      }

      if (!connections[member.id]) {
        connections[member.id] = [socket];
      } else {
        connections[member.id].push(socket);
      }

      socket.on('disconnect', () => {
        for (let i = 0; i < connections[member.id].length; ++i) {
          if (connections[member.id][i] === socket) {
            connections[member.id].splice(i, 1);
          }
        }
        logger.writeEventLog({
          entity: 'WebSocket',
          type: 'Disconnect',
          emitter: member.id,
        });
      });

      logger.writeEventLog({
        entity: 'WebSocket',
        type: 'Connect',
        emitter: member.id,
      });
    });
  }
  return { io, server, connections };
}

exports.attachSocketIO = attachSocketIO;

/**
 * 像所有的客户端广播论坛的一个事件
 *
 * @param {('Post'|'Discussion')} entity 事件的主体
 * @param {('Create'|'Update'|'Delete')} eventType 时间的类型
 * @param {Object} affects 受影响的主体信息
 * @param {string} affects.discussionId 受影响的讨论 ID
 * @param {string} affects.category 受影响的分类
 * @param {string} affects.postIndex 受影响的帖子楼层
 */
function broadcastEvent (entity, eventType, affects) {
  io.emit('event', {
    entity, eventType, affects,
  });
}

exports.broadcastEvent = broadcastEvent;

Object.defineProperty(exports, 'server', {
  get: function () {
    return server;
  },
});

Object.defineProperty(exports, 'io', {
  get: function () {
    return io;
  },
});

Object.defineProperty(exports, 'connections', {
  get: function () {
    return connections;
  },
});
