# rawr (a.k.a. RAWRpc)

[![NPM](https://nodei.co/npm/rawr.png?compact=true)](https://nodei.co/npm/rawr/)  [![CircleCI](https://circleci.com/gh/iceddev/rawr.svg?style=svg)](https://circleci.com/gh/iceddev/rawr)

Remote Procedure Calls ([JSON-RPC](http://json-rpc.org/wiki/specification)) sent over any [EventEmitter](https://nodejs.org/dist/latest-v8.x/docs/api/events.html#events_class_eventemitter)-based transport.  [WebWorkers](/transports/worker), [WebSockets](/transports/websocket), [MQTT](/transports/mqtt), and more!

![RAWRpc](rawr.jpg)

## Installation

`npm install rawr`


## Using rawr with a webworker

Every rawr peer can act as both a client and a server, and make remote method calls in either direction.

For example, we can use methods that belong to a webworker.

#### In our worker.js file:
```javascript
import rawr, { transports } from 'rawr';

// In this instantiation, we can pass in an object to 
// `methods` that is exposed to our web page (see below)
const peer = rawr({
  transport: transports.worker(),
  methods: { calculatePrimes },
});

function calculatePrimes(howMany) {
  // Do something CPU intensive in this thread that
  // would otherwise be too expensive for our web page
  ...
  return primes;
}
```

#### In our web page:
```javascript
import rawr, { transports } from 'rawr';

const myWorker = new Worker('/worker.js');
const peer = rawr({transport: transports.worker(myWorker)});

// Remote methods are *~automatically available~*
const result = await peer.methods.calculatePrimes(349582);
```

The methods are available to the rawr peer through the magic of [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

![Magic](magic.gif)

## Using rawr with a websocket

We could use rawr to make calls to a remote server such as a websocket.
Simply use a different transport.

#### on our web page:
```javascript
import rawr, { transports } from 'rawr';

const socket = new WebSocket('ws://localhost:8080');

socket.onopen = (event) => {
  // create the rawr peer
  const peer = rawr({
    transport: transports.websocket(socket)
  });
};
```

The websocket server could even make *arbitrary calls to the client!*

#### on the server:
```javascript
socketServer.on('connection', (socket) => {
  const peer = rawr({ 
    transport: transports.websocket(socket) 
  });

  const result = await peer.methods.doSomethingOnClient();
});
```

## Handling Notifications

Peers can also send each other [notifications](https://www.jsonrpc.org/specification#notification):

```javascript
peer.notifiers.saySomething('hello');
```

Receiving those notifications from another peer is just as simple:
```javascript
peer.notifications.onsaySomething((words) => {
  console.log(words); //hello
});
```

