const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const rawr = require('../../');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function add(x, y) {
  return x + y;
}

wss.on('connection', (socket) => {
  const rawrPeer = rawr({ transport: rawr.transports.websocket(socket) });
  rawrPeer.addHandler('add', add);

  // make RPC calls to the client
  const intervalId = setInterval(async () => {
    const val = await rawrPeer.methods.getRandom();
    console.log('random from client', val);
  }, 1000);

  // cleanup
  socket.on('close', () => {
    console.log('disconnected');
    clearInterval(intervalId);
  });
});

server.listen(8080, () => {
  console.log('Listening on %d', server.address().port);
});
