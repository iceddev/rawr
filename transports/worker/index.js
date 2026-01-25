import EventEmitter from 'eventemitter3';

/**
 * Worker transport for DOM side (main thread talking to worker)
 * @param {Worker} webWorker - Web Worker instance
 * @returns {EventEmitter} rawr-compatible transport
 */
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

/**
 * Worker transport for worker side (inside the worker)
 * @returns {EventEmitter} rawr-compatible transport
 */
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

/**
 * Worker transport - auto-detects DOM or worker context
 * @param {Worker} [webWorker] - Web Worker instance (omit if inside worker)
 * @returns {EventEmitter} rawr-compatible transport
 */
export default function transport(webWorker) {
  if (webWorker) {
    return dom(webWorker);
  }
  return worker();
}

// Named exports for explicit usage
export { dom, worker };
