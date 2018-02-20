'use strict';

const chalk = require('chalk');

function getTime () {
  return new Date().getTime();
}

function writeEventLog ({ entity, type, emitter, comments }) {
  console.log([
    chalk.cyan('[' + getTime() + ']'),
    chalk.green('Event:'),
    chalk.yellow((entity + ':            ').substr(0, 12)),
    chalk.blue(emitter),
    type,
    '(' + Object.keys(comments || {}).map(key => `${key}=${comments[key]}`).join(';') + ')',
  ].join(' '));
}

function writeInfoLog ({ entity, content }) {
  console.log([
    chalk.cyan('[' + getTime() + ']'),
    chalk.green('Info: '),
    chalk.yellow((entity + ':            ').substr(0, 12)),
    content,
  ].join(' '));
}

module.exports = {
  writeEventLog,
  writeInfoLog,
};
