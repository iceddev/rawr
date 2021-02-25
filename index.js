const { EventEmitter } = require('events');
const transports = require('./transports');

function rawr({ transport, timeout = 0, handlers = {}, methods }) {
  let callId = 0;
  // eslint-disable-next-line no-param-reassign
  methods = methods || handlers; // backwards compat
  const pendingCalls = {};
  const methodHandlers = {};
  const notificationEvents = new EventEmitter();
  notificationEvents.on = notificationEvents.on.bind(notificationEvents);

  transport.on('rpc', (msg) => {
    if (msg.id) {
      // handle an RPC request
      if (msg.params && methodHandlers[msg.method]) {
        methodHandlers[msg.method](msg);
        return;
      }
      // handle an RPC result
      const promise = pendingCalls[msg.id];
      if (promise) {
        if (promise.timeoutId) {
          clearTimeout(promise.timeoutId);
        }
        delete pendingCalls[msg.id];
        if (msg.error) {
          promise.reject(msg.error);
        }
        return promise.resolve(msg.result);
      }
      return;
    }
    // handle a notification
    msg.params.unshift(msg.method);
    notificationEvents.emit(...msg.params);
  });

  function addHandler(methodName, handler) {
    methodHandlers[methodName] = (msg) => {
      Promise.resolve()
        .then(() => {
          return handler.apply(this, msg.params);
        })
        .then((result) => {
          transport.send({
            id: msg.id,
            result
          });
        })
        .catch((error) => {
          const serializedError = { message: error.message };
          if (error.code) {
            serializedError.code = error.code;
          }
          transport.send({
            id: msg.id,
            error: serializedError
          });
        });
    };
  }

  Object.keys(methods).forEach((m) => {
    addHandler(m, methods[m]);
  });

  const methodsProxy = new Proxy({}, {
    get: (target, name) => {
      return (...args) => {
        const id = ++callId;
        const msg = {
          jsonrpc: '2.0',
          method: name,
          params: args,
          id
        };

        let timeoutId;
        if (timeout) {
          timeoutId = setTimeout(() => {
            if (pendingCalls[id]) {
              const err = new Error('RPC timeout');
              err.code = 504;
              pendingCalls[id].reject(err);
              delete pendingCalls[id];
            }
          }, timeout);
        }

        const response = new Promise((resolve, reject) => {
          pendingCalls[id] = { resolve, reject, timeoutId };
        });

        transport.send(msg);

        return response;
      };
    }
  });

  const notifiers = new Proxy({}, {
    get: (target, name) => {
      return (...args) => {
        const msg = {
          jsonrpc: '2.0',
          method: name,
          params: args
        };
        transport.send(msg);
      };
    }
  });

  const notifications = new Proxy({}, {
    get: (target, name) => {
      return (callback) => {
        notificationEvents.on(name.substring(2), (...args) => {
          return callback.apply(callback, args);
        });
      };
    }
  });

  return {
    methods: methodsProxy,
    addHandler,
    notifications,
    notifiers,
    transport,
  };
}

rawr.transports = transports;

module.exports = rawr;
