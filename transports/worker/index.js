const { EventEmitter } = require('events');

function dom(webWorker) {
  const emitter = new EventEmitter();
  webWorker.addEventListener('message', (msg) => {
    const { data } = msg;
    if (data && (data.method || (data.id && ('result' in data || 'error' in data)))) {
      emitter.emit('rpc', data);
    }
  });
  emitter.send = (msg, config) => {
    webWorker.postMessage(msg, config ? config.postMessageOptions : undefined);
  };
  return emitter;
}

function worker() {
  const emitter = new EventEmitter();
  self.onmessage = (msg) => {
    const { data } = msg;
    if (data && (data.method || (data.id && ('result' in data || 'error' in data)))) {
      emitter.emit('rpc', data);
    }
  };
  emitter.send = (msg, config) => {
    self.postMessage(msg, config ? config.postMessageOptions : undefined);
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
