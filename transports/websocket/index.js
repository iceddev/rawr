import EventEmitter from 'eventemitter3';

/**
 * WebSocket transport for rawr
 * Works with browser WebSocket API (addEventListener) and Node.js ws library (on)
 * @param {WebSocket} socket - WebSocket instance
 * @param {boolean} allowBinary - Allow binary messages (browser only)
 * @returns {EventEmitter} rawr-compatible transport
 */
export default function websocket(socket, allowBinary = false) {
  const emitter = new EventEmitter();

  const handleMessage = async (data) => {
    // Handle both browser (MessageEvent) and Node.js ws (Buffer/string) formats
    let str = data;

    // Browser MessageEvent
    if (data && typeof data === 'object' && 'data' in data) {
      str = data.data;
      if (allowBinary && str instanceof Blob) {
        str = await new Response(str).text().catch(() => null);
      }
    }

    // Node.js ws Buffer
    if (Buffer && Buffer.isBuffer(str)) {
      str = str.toString();
    }

    if (typeof str === 'string') {
      try {
        const msg = JSON.parse(str);
        if (msg.method || (msg.id && ('result' in msg || 'error' in msg))) {
          emitter.emit('rpc', msg);
        }
      } catch (err) {
        // Not a JSON message, ignore
      }
    }
  };

  // Support both browser WebSocket (addEventListener) and Node.js ws (on)
  if (typeof socket.addEventListener === 'function') {
    socket.addEventListener('message', handleMessage);
  } else if (typeof socket.on === 'function') {
    socket.on('message', handleMessage);
  }

  emitter.send = (msg) => {
    socket.send(JSON.stringify(msg));
  };

  return emitter;
}
