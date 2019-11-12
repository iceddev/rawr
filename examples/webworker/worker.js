const rawr = require('../../');

function add(x, y) {
  return x + y;
}

// create the rawr peer
const rawrPeer = rawr({ transport: rawr.transports.worker(), handlers: { add } });

// make RPC calls to the DOM
setInterval(async () => {
  const val = await rawrPeer.methods.getRandom();
  console.log('random from DOM', val);
}, 1000);
