# rawr (a.k.a. RAWRpc)

[![NPM](https://nodei.co/npm/rawr.png?compact=true)](https://nodei.co/npm/rawr/)  [![CircleCI](https://circleci.com/gh/iceddev/rawr.svg?style=svg)](https://circleci.com/gh/iceddev/rawr)

Remote Procedure Calls ([JSON-RPC](http://json-rpc.org/wiki/specification)) sent over any [EventEmitter](https://nodejs.org/dist/latest-v8.x/docs/api/events.html#events_class_eventemitter)-based transport.  [WebWorkers](/transports/worker), [WebSockets](/transports/websocket), [MQTT](/transports/mqtt), and more!

![RAWRpc](https://rawgithub.com/phated/badart/master/reptar_rawr.jpg)




## Installation

`npm install rawr`


## Using rawr with a webworker

Every rawr client can act as both a client and a server, and make remote function calls in either direction.

For example, if we want the browser to call functions that belong to a webworker:
```javascript
import rawr from 'rawr';
import transport from 'rawr/tansports/worker';

const myWorker = new Worker('/my-worker.js');

const peer = rawr({transport: transport(myWorker)});

const result = await peer.methods.doSomething('lots of data');
```

Our WebWorker code might look something like:
```javascript
import rawr from 'rawr';
import transport from 'rawr/tansports/worker';

const peer = rawr({transport: transport(), handlers: {doSomething}});

function doSomething(inputData) {
  // do some heavy lifting in this thread
  // return a result
}
```

## Using rawr with a websocket

We could use rawr to make calls to a remote server such as a websocket.
Simply use a different transport:
```javascript
import rawr from 'rawr';
import transport from 'rawr/tansports/websocket';

const socket = new WebSocket('ws://localhost:8080');

socket.onopen = (event) => {
  // create the rawr peer
  const peer = rawr({transport: transport(socket)});
};
```

The websocket server could even make arbitrary calls to the client!
```javascript
socketServer.on('connection', (socket) => {
  const peer = rawr({ transport: transport(socket) })

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

