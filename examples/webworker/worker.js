const rawr = require('../../');
const transport = require('../../transports/worker');

function add(x, y) {
  return x + y;
}

// create the rawr peer
const rawrPeer = rawr({ transport: transport(), handlers: { add } });

// make RPC calls to the DOM
setInterval(async () => {
  const val = await rawrPeer.methods.getRandom();
  console.log('random from DOM', val);
}, 1000);
