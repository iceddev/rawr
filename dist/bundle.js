var Rawr = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter2() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter2.prototype.eventNames = function eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0) return names;
        for (name in events = this._events) {
          if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter2.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
          ee[i] = handlers[i].fn;
        }
        return ee;
      };
      EventEmitter2.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length, j;
          for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter2.prototype.on = function on(event, fn, context) {
        return addListener(this, event, fn, context, false);
      };
      EventEmitter2.prototype.once = function once(event, fn, context) {
        return addListener(this, event, fn, context, true);
      };
      EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i = 0, events = [], length = listeners.length; i < length; i++) {
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
              events.push(listeners[i]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
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
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
      EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
      EventEmitter2.prefixed = prefix;
      EventEmitter2.EventEmitter = EventEmitter2;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter2;
      }
    }
  });

  // global.js
  var global_exports = {};
  __export(global_exports, {
    default: () => global_default
  });

  // node_modules/eventemitter3/index.mjs
  var import_index = __toESM(require_eventemitter3(), 1);
  var eventemitter3_default = import_index.default;

  // transports/index.js
  var transports_exports = {};
  __export(transports_exports, {
    mqtt: () => mqtt,
    socketio: () => socketio,
    websocket: () => websocket,
    worker: () => transport
  });

  // transports/mqtt/index.js
  function mqtt({ connection, subTopic, pubTopic, subscribe = true }) {
    const emitter = new eventemitter3_default();
    if (subscribe) {
      connection.subscribe(subTopic);
    }
    connection.on("message", (topic, message) => {
      if (topic === subTopic) {
        try {
          const msg = JSON.parse(message.toString());
          if (msg.method || msg.id && ("result" in msg || "error" in msg)) {
            emitter.emit("rpc", msg);
          }
        } catch (err) {
        }
      }
    });
    emitter.send = (msg) => {
      connection.publish(pubTopic, JSON.stringify(msg));
    };
    return emitter;
  }

  // transports/socketio/index.js
  function socketio({ connection, subTopic, pubTopic }) {
    const emitter = new eventemitter3_default();
    connection.on(subTopic, (msg) => {
      if (msg.method || msg.id && ("result" in msg || "error" in msg)) {
        emitter.emit("rpc", msg);
      }
    });
    emitter.send = (msg) => {
      connection.emit(pubTopic, msg);
    };
    return emitter;
  }

  // transports/websocket/index.js
  function websocket(socket, allowBinary = false) {
    const emitter = new eventemitter3_default();
    const handleMessage = async (data) => {
      let str = data;
      if (data && typeof data === "object" && "data" in data) {
        str = data.data;
        if (allowBinary && str instanceof Blob) {
          str = await new Response(str).text().catch(() => null);
        }
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer(str)) {
        str = str.toString();
      }
      if (typeof str === "string") {
        try {
          const msg = JSON.parse(str);
          if (msg.method || msg.id && ("result" in msg || "error" in msg)) {
            emitter.emit("rpc", msg);
          }
        } catch (err) {
        }
      }
    };
    if (typeof socket.addEventListener === "function") {
      socket.addEventListener("message", handleMessage);
    } else if (typeof socket.on === "function") {
      socket.on("message", handleMessage);
    }
    emitter.send = (msg) => {
      socket.send(JSON.stringify(msg));
    };
    return emitter;
  }

  // transports/worker/index.js
  function dom(webWorker) {
    const emitter = new eventemitter3_default();
    webWorker.addEventListener("message", (msg) => {
      const { data } = msg;
      if (data && (data.method || data.id && ("result" in data || "error" in data))) {
        emitter.emit("rpc", data);
      }
    });
    emitter.send = (msg, config) => {
      webWorker.postMessage(msg, config ? config.postMessageOptions : void 0);
    };
    return emitter;
  }
  function worker() {
    const emitter = new eventemitter3_default();
    self.onmessage = (msg) => {
      const { data } = msg;
      if (data && (data.method || data.id && ("result" in data || "error" in data))) {
        emitter.emit("rpc", data);
      }
    };
    emitter.send = (msg, config) => {
      self.postMessage(msg, config ? config.postMessageOptions : void 0);
    };
    return emitter;
  }
  function transport(webWorker) {
    if (webWorker) {
      return dom(webWorker);
    }
    return worker();
  }

  // index.js
  function rawr({ transport: transport2, timeout = 0, handlers = {}, methods, idGenerator }) {
    let callId = 0;
    methods = methods || handlers || {};
    const pendingCalls = {};
    const methodHandlers = {};
    const notificationEvents = new eventemitter3_default();
    notificationEvents.on = notificationEvents.on.bind(notificationEvents);
    transport2.on("rpc", (msg) => {
      if (msg.id) {
        if (msg.params && methodHandlers[msg.method]) {
          methodHandlers[msg.method](msg);
          return;
        }
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
      msg.params.unshift(msg.method);
      notificationEvents.emit(...msg.params);
    });
    function addHandler(methodName, handler) {
      methodHandlers[methodName] = (msg) => {
        Promise.resolve().then(() => {
          return handler.apply(this, msg.params);
        }).then((result) => {
          transport2.send({
            id: msg.id,
            result
          });
        }).catch((error) => {
          const serializedError = { message: error.message };
          if (error.code) {
            serializedError.code = error.code;
          }
          transport2.send({
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
        jsonrpc: "2.0",
        method,
        params,
        id
      };
      let timeoutId;
      if (config.timeout || timeout) {
        timeoutId = setTimeout(() => {
          if (pendingCalls[id]) {
            const err = new Error("RPC timeout");
            err.code = 504;
            pendingCalls[id].reject(err);
            delete pendingCalls[id];
          }
        }, config.timeout || timeout);
      }
      const response = new Promise((resolve, reject) => {
        pendingCalls[id] = { resolve, reject, timeoutId };
      });
      transport2.send(msg, config);
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
            if (testArg && typeof testArg === "object" && !Array.isArray(testArg)) {
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
            jsonrpc: "2.0",
            method: name,
            params: args
          };
          transport2.send(msg);
        };
      }
    });
    const configurableNotifiersProxy = new Proxy({}, {
      get: (target, name) => {
        return (...args) => {
          let config;
          if (args.length) {
            const testArg = args.pop();
            if (testArg && typeof testArg === "object" && !Array.isArray(testArg)) {
              config = testArg;
            } else {
              args.push(testArg);
            }
          }
          const msg = {
            jsonrpc: "2.0",
            method: name,
            params: args
          };
          transport2.send(msg, config || {});
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
      transport: transport2
    };
  }
  rawr.transports = transports_exports;
  var index_default = rawr;

  // global.js
  index_default.EventEmitter = eventemitter3_default;
  index_default.transports = transports_exports;
  globalThis.Rawr = index_default;
  var global_default = index_default;
  return __toCommonJS(global_exports);
})();
