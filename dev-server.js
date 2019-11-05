const { spawn } = require('child_process');
const os = require('os');

const NPX_COMMAND = (() => {
  if ((/^win/iu).test(os.platform)) {
    return 'npx.cmd';
  }
  return 'npx';
})();

// start webpack-dev-server
const frontend = require('./web/server');

// spawn backend code with nodemon
const backend = spawn(NPX_COMMAND, [
  'nodemon',
  '--config',
  '.nodemon.json',
  '-q',
  'index',
], {
  stdio: 'inherit',
});

// kill process when exit

process.on('exit', () => {
  backend.kill();
});
