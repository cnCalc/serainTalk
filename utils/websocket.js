'use strict';

const socket = require('socket.io');
const http = require('http');
const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const staticConfig = require('../config/staticConfig');
const errorMessage = require('./error-messages');
const dbTool = require('../database');

exports = module.exports = {};

let server, io, connections;

function attachSocketIO (app) {
  if (app) {
    server = http.Server(app);
    io = socket(server, { path: '/api/ws' });
    connections = {};

    io.on('connection', async socket => {
      let member;
      let token = socket.handshake.query.token;
      try {
        // member = jwt.verify(token, staticConfig.jwtSecret);

        // member.id = member._id;
        // member._id = ObjectID(member.id);
        // socket.member = member.id;
        let payload = jwt.verify(token, staticConfig.jwtSecret);
        member = await dbTool.commonMember.findOne({ _id: ObjectID(payload.id) });
        member.id = member._id;
        socket.member = member.id;
      } catch (err) {
        socket.emit('failure', { status: 'error', message: errorMessage.NEED_LOGIN, code: 'NEED_LOGIN' });
        return socket.disconnect();
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
        console.log(`Client disconnected: ${member.username}, connections remaining: ${connections[member.id].length}`);
      });

      console.log('Client connected: ' + member.username);
    });
  }
  return { io, server, connections };
}

exports.attachSocketIO = attachSocketIO;

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
