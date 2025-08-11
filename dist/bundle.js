(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const rawr = require('./');
const EventEmitter = require('eventemitter3');
rawr.EventEmitter = EventEmitter;

globalThis.Rawr = rawr;

module.exports = rawr;

},{"./":2,"eventemitter3":3}],2:[function(require,module,exports){
const EventEmitter = require('eventemitter3');
const transports = require('./transports');

function rawr({ transport, timeout = 0, handlers = {}, methods, idGenerator }) {
  let callId = 0;
  // eslint-disable-next-line no-param-reassign
  methods = methods || handlers || {}; // backwards compat
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

  function sendMessage(method, params, config) {
    const id = idGenerator ? idGenerator() : ++callId;
    const msg = {
      jsonrpc: '2.0',
      method,
      params,
      id
    };

    let timeoutId;
    if (config.timeout || timeout) {
      timeoutId = setTimeout(() => {
        if (pendingCalls[id]) {
          const err = new Error('RPC timeout');
          err.code = 504;
          pendingCalls[id].reject(err);
          delete pendingCalls[id];
        }
      }, config.timeout || timeout);
    }

    const response = new Promise((resolve, reject) => {
      pendingCalls[id] = { resolve, reject, timeoutId };
    });

    transport.send(msg, config);

    return response;
  }

  const methodsProxy = new Proxy({}, {
    get: (target, name) => {
      return (...args) => {
        return sendMessage(name, args, {});
      };
    }
  });

  const configurableMethodsProxy = new Proxy({}, {
    get: (target, name) => {
      return (...args) => {
        let config;
        if (args.length) {
          const testArg = args.pop();
          if (testArg && typeof testArg === 'object' && !Array.isArray(testArg)) {
            config = testArg;
          } else {
            args.push(testArg);
          }
        }
        return sendMessage(name, args, config || {});
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

  const configurableNotifiersProxy = new Proxy({}, {
    get: (target, name) => {
      return (...args) => {
        let config;
        if (args.length) {
          const testArg = args.pop();
          if (testArg && typeof testArg === 'object' && !Array.isArray(testArg)) {
            config = testArg;
          } else {
            args.push(testArg);
          }
        }
        const msg = {
          jsonrpc: '2.0',
          method: name,
          params: args
        };
        transport.send(msg, config || {});
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
    methodsExt: configurableMethodsProxy,
    addHandler,
    notifications,
    notifiers,
    notifiersExt: configurableNotifiersProxy,
    transport,
  };
}

rawr.transports = transports;

module.exports = rawr;

},{"./transports":4,"eventemitter3":3}],3:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],4:[function(require,module,exports){
const mqtt = require('./mqtt');
const socketio = require('./socketio');
const websocket = require('./websocket');
const worker = require('./worker');

module.exports = {
    mqtt,
    socketio,
    websocket,
    worker
};
},{"./mqtt":5,"./socketio":6,"./websocket":7,"./worker":8}],5:[function(require,module,exports){
const EventEmitter = require('eventemitter3');

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

},{"eventemitter3":3}],6:[function(require,module,exports){
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

},{"eventemitter3":3}],7:[function(require,module,exports){
const EventEmitter = require('eventemitter3');

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

},{"eventemitter3":3}],8:[function(require,module,exports){
const EventEmitter = require('eventemitter3');

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

},{"eventemitter3":3}]},{},[1]);
