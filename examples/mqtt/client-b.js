const mqtt = require('mqtt');
const rawr = require('../../');

const connection = mqtt.connect('mqtt://localhost');

function getRandom() {
  return Math.random();
}

// create the rawr peer
const rawrPeer = rawr({
  transport: rawr.transports.mqtt({ connection, pubTopic: 'client-a', subTopic: 'client-b' }),
  handlers: { getRandom },
  timeout: 1000
});

// make RPC calls to the DOM
setInterval(async () => {
  try {
    const val = await rawrPeer.methods.add(1, 3);
    console.log('result sent from client-a', val);
  } catch (error) {
    console.log('error calling client-a', error.message);
  }
}, 1000);
