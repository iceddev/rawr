const { EventEmitter } = require('events');

function transport(socket, allowBinary = false) {
  const emitter = new EventEmitter();
  socket.addEventListener('message', async (evt) => {
    let { data } = evt;
    if (allowBinary && data instanceof Blob) {
      data = await (new Response(data)).text().catch(() => null);
    }
    if (typeof evt.data === 'string') {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.method || (msg.id && ('result' in msg || 'error' in msg))) {
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
