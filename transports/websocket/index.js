const { EventEmitter } = require('events');

function transport(socket) {
  const emitter = new EventEmitter();
  socket.addEventListener('message', (evt) => {
    if (typeof evt.data === 'string') {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.method || (msg.id && 'result' in msg)) {
          emitter.emit('rpc', msg);
        }
      } catch (err) {
        // wasn't a JSON message
      }
    }
  });
  emitter.send = (msg) => {
    socket.send(JSON.stringify(msg));
  };
  return emitter;
}

module.exports = transport;
