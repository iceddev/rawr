const chai = require('chai');
const { EventEmitter } = require('events');
const rawr = require('../');

chai.should();

function mockTransports() {
  const a = new EventEmitter();
  const b = new EventEmitter();

  a.send = (msg) => {
    b.emit('message', {data: msg});
  };
  a.addEventListener = (topic, cb) => {
    a.on(topic, cb);
  }

  b.send = (msg) => {
    a.emit('message', {data: msg});
  };
  b.addEventListener = (topic, cb) => {
    b.on(topic, cb);
  }

  const transportA = rawr.transports.websocket(a);
  const transportB = rawr.transports.websocket(b);

  return { transportA, transportB };
}

function helloTest(name) {
  return new Promise((resolve, reject) => {
    if (name === 'bad') {
      const error = new Error('bad name !');
      error.code = 9000;
      return reject(error);
    }
    setTimeout(() => {
      return resolve(`hello, ${name}`);
    }, 100);
  });
}

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

describe('websocket', () => {
  it('should make a client', (done) => {
    const { transportA } = mockTransports();
    const client = rawr({ transport: transportA });
    client.should.be.a('object');
    client.addHandler.should.be.a('function');
    done();
  });

  it('client should make a successful rpc call to another peer', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { add } });
    const clientB = rawr({ transport: transportB, handlers: { subtract } });

    const resultA = await clientA.methods.subtract(7, 2);
    const resultB = await clientB.methods.add(1, 2);
    resultA.should.equal(5);
    resultB.should.equal(3);
  });

  it('client should make an unsuccessful rpc call to a peer', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB });

    clientA.should.be.an('object');
    try {
      await clientB.methods.helloTest('bad');
    } catch (error) {
      error.code.should.equal(9000);
    }
  });

  it('client handle an rpc under a specified timeout', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB, timeout: 1000 });

    clientA.should.be.an('object');
    const result = await clientB.methods.helloTest('luis');
    result.should.equal('hello, luis');
  });

  it('client handle an rpc timeout', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB, timeout: 10 });

    clientA.should.be.an('object');
    try {
      await clientB.methods.helloTest('luis');
    } catch (error) {
      error.code.should.equal(504);
    }
  });

  it('client should be able to send a notification to a server', (done) => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA });
    const clientB = rawr({ transport: transportB });

    clientA.notifications.ondoSomething((someData) => {
      someData.should.equal('testing_notification');
      done();
    });

    clientB.notifiers.doSomething('testing_notification');
  });
});
