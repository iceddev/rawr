const rawr = require('./');

const mqtt = require('./transports/mqtt');
const socketio = require('./transports/socketio');
const worker = require('./transports/worker');
const websocket = require('./transports/websocket');

rawr.transports = {
  mqtt,
  socketio,
  websocket,
  worker
};

global.rawr = rawr;

module.exports = rawr;
