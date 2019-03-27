const { EventEmitter } = require('events');

function dom(webWorker) {
  const emitter = new EventEmitter();
  webWorker.addEventListener('message', function(msg) {
    const { data } = msg;
    if(data && (data.method || ((data.id && data.hasOwnProperty('result')) ))) {
      emitter.emit('rpc', data);
    }
  });
  emitter.send = function(msg) {
    webWorker.postMessage(msg);
  };
  return emitter;
}

function worker() {
  const emitter = new EventEmitter();
  self.onmessage = function (msg) {
    const { data } = msg;
    if(data && (data.method || ((data.id && data.hasOwnProperty('result')) ))) {
      emitter.emit('rpc', data);
    }
  };
  emitter.send = function(msg) {
    self.postMessage(msg);
  };
  return emitter;
}

function transport(webWorker) {
  if(webWorker) {
    return dom(webWorker);
  }
  return worker();
}

//backwards compat
transport.dom = dom;
transport.worker = worker;

module.exports = transport;