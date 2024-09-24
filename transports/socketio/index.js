const EventEmitter = require('eventemitter3');

function transport({ connection, subTopic, pubTopic }) {
  const emitter = new EventEmitter();
  connection.on(subTopic, (msg) => {
    if (msg.method || (msg.id && ('result' in msg || 'error' in msg))) {
      emitter.emit('rpc', msg);
    }
  });
  emitter.send = (msg) => {
    connection.emit(pubTopic, msg);
  };
  return emitter;
}

module.exports = transport;
