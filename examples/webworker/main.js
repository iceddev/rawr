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