(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const rawr = require('../../');
const transport = require('../../transports/worker');

const myWorker = new Worker('/worker-bundle.js');

// create the rawr peer
const rawPeer = rawr({transport: transport(myWorker)});

// handle requests from the webworker
rawPeer.addHandler('getRandom', () => Math.random());

// make an RPC call to the webworker server on a button click
document.getElementById('addBtn').addEventListener('click', async () => {
  const num1 = parseFloat(document.getElementById('number1').value);
  const num2 = parseFloat(document.getElementById('number2').value);
  const result = await rawPeer.methods.add(num1, num2);
  document.getElementById('result').innerHTML = result;
}, false);
},{"../../":3,"../../transports/worker":4}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
const { EventEmitter } = require('events');

function rawr({ transport, timeout = 0, handlers = {} }) {
  let callId = 0;
  const pendingCalls = {};
  const methodHandlers = {};
  const notificationEvents = new EventEmitter();
  notificationEvents.on = notificationEvents.on.bind(notificationEvents);

  transport.on('rpc', function(msg) {
    if(msg.id) {
      if(msg.params && methodHandlers[msg.method]) { //handle the request
        methodHandlers[msg.method](msg);
        return;
      }
      else { //handle the result
        const promise = pendingCalls[msg.id];
        if(promise) {
          if(promise.timeoutId) {
            clearTimeout(promise.timeoutId);
          }
          delete pendingCalls[msg.id];
          if (msg.error) {
            promise.reject(msg.error);
          }
          else {
            promise.resolve(msg.result);
          }
        }
        return;
      }
    }
    
    // handle notification
    msg.params.unshift(msg.method);
    notificationEvents.emit.apply(notificationEvents, msg.params);
  });

  function addHandler(methodName, handler) {
    methodHandlers[methodName] = function(msg) {
      Promise.resolve()
        .then(function() {
          return handler.apply(this, msg.params);
        })
        .then(function(result) {
          transport.send({
            id: msg.id,
            result: result
          });
        })
        .catch(function(error) {
          const serializedError = {message: error.message};
          if(error.code) {
            serializedError.code = error.code;
          } 
          transport.send({
            id: msg.id,
            error: serializedError
          });
        });
    }
  }

  for (const m in handlers) {
    addHandler(m, handlers[m]);
  }

  const methods = new Proxy({}, {
    get: function(target, name) {

      return function (...args) {
        const id = ++callId;
        const msg = {
          jsonrpc : '2.0',
          method: name,
          params: args,
          id
        };

        let timeoutId;
        if(timeout) {
          timeoutId = setTimeout(function() {
            if(pendingCalls[id]) {
              const err = new Error('RPC timeout');
              err.code = 504;
              pendingCalls[id].reject(err);
              delete pendingCalls[id];
            }
          }, timeout);
        }
        
        const response = new Promise(function(resolve, reject) {
          pendingCalls[id] = { resolve: resolve, reject: reject, timeoutId: timeoutId };
        });

        transport.send(msg);

        return response;
      }
    }
  });

  const notifiers = new Proxy({}, {
    get: function(target, name) {

      return function (...args) {
        const msg = {
          jsonrpc : '2.0',
          method: name,
          params: args
        };
        transport.send(msg);
        return;
      }
    }
  });

  const notifications = new Proxy({}, {
    get: function(target, name) {
      return function (callback) {
        notificationEvents.on(name.substring(2), function(...args) {
          return callback.apply(callback, args);
        });
      }
    }
  });

  return { methods, addHandler, notifications, notifiers };

}

module.exports = rawr;

},{"events":2}],4:[function(require,module,exports){
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
},{"events":2}]},{},[1]);
