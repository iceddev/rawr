const mqtt = require('mqtt');
const rawr = require('../../');

const connection = mqtt.connect('mqtt://localhost');

function add(x, y) {
  return x + y;
}

// create the rawr peer
const rawrPeer = rawr({
  transport: rawr.transports.mqtt({ connection, pubTopic: 'client-b', subTopic: 'client-a' }),
  handlers: { add },
  timeout: 1000
});

// make RPC calls to the DOM
setInterval(async () => {
  try {
    const val = await rawrPeer.methods.getRandom();
    console.log('result sent from client-b', val);
  } catch (error) {
    console.log('error calling client-b', error.message);
  }
}, 1000);
