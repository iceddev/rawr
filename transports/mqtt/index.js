const { EventEmitter } = require('events');

function transport({ connection, subTopic, pubTopic, subscribe = true }) {
  const emitter = new EventEmitter();
  if (subscribe) {
    connection.subscribe(subTopic);
  }
  connection.on('message', (topic, message) => {
    if (topic === subTopic) {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.method || (msg.id && ('result' in msg || 'error' in msg))) {
          emitter.emit('rpc', msg);
        }
      } catch (err) {
        console.error(err);
      }
    }
  });
  emitter.send = (msg) => {
    connection.publish(pubTopic, JSON.stringify(msg));
  };
  return emitter;
}

module.exports = transport;
