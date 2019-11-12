const rawr = require('../../');

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // create the rawr peer
  const rawPeer = rawr({ transport: rawr.transports.websocket(ws) });

  // handle requests from the websocket server
  rawPeer.addHandler('getRandom', () => Math.random());

  // make an RPC call to the websocket server on a button click
  document.getElementById('addBtn').addEventListener('click', async () => {
    const num1 = parseFloat(document.getElementById('number1').value);
    const num2 = parseFloat(document.getElementById('number2').value);
    const result = await rawPeer.methods.add(num1, num2);
    document.getElementById('result').innerHTML = result;
  }, false);
};
