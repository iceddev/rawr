import EventEmitter from 'eventemitter3';

/**
 * Socket.IO transport for rawr
 * @param {object} options
 * @param {object} options.connection - Socket.IO client connection
 * @param {string} options.subTopic - Event name to listen for incoming messages
 * @param {string} options.pubTopic - Event name to emit outgoing messages
 * @returns {EventEmitter} rawr-compatible transport
 */
export default function socketio({ connection, subTopic, pubTopic }) {
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
