import EventEmitter from 'eventemitter3';

/**
 * MQTT transport for rawr
 * @param {object} options
 * @param {object} options.connection - MQTT client connection
 * @param {string} options.subTopic - Topic to subscribe to for incoming messages
 * @param {string} options.pubTopic - Topic to publish outgoing messages to
 * @param {boolean} [options.subscribe=true] - Whether to subscribe to subTopic
 * @returns {EventEmitter} rawr-compatible transport
 */
export default function mqtt({ connection, subTopic, pubTopic, subscribe = true }) {
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
        // Not a JSON message, ignore
      }
    }
  });

  emitter.send = (msg) => {
    connection.publish(pubTopic, JSON.stringify(msg));
  };

  return emitter;
}
