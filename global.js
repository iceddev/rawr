const rawr = require('./');
const EventEmitter = require('eventemitter3');
rawr.EventEmitter = EventEmitter;

globalThis.Rawr = rawr;

module.exports = rawr;
