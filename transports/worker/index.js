const { EventEmitter } = require('events');

function dom(webWorker) {
  const emitter = new EventEmitter();
  webWorker.addEventListener('message', (msg) => {
    const { data } = msg;
    if (data && (data.method || (data.id && 'result' in msg))) {
      emitter.emit('rpc', data);
    }
  });
  emitter.send = (msg) => {
    webWorker.postMessage(msg);
  };
  return emitter;
}

function worker() {
  const emitter = new EventEmitter();
  self.onmessage = (msg) => {
    const { data } = msg;
    if (data && (data.method || (data.id && 'result' in msg))) {
      emitter.emit('rpc', data);
    }
  };
  emitter.send = (msg) => {
    self.postMessage(msg);
  };
  return emitter;
}

function transport(webWorker) {
  if (webWorker) {
    return dom(webWorker);
  }
  return worker();
}

// backwards compat
transport.dom = dom;
transport.worker = worker;

module.exports = transport;
