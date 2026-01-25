import rawr, { transports } from './index.js';
import EventEmitter from 'eventemitter3';

rawr.EventEmitter = EventEmitter;
rawr.transports = transports;

globalThis.Rawr = rawr;

export default rawr;
