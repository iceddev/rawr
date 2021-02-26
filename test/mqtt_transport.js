const chai = require('chai');
const { EventEmitter } = require('events');
const rawr = require('../');

chai.should();

function mockTransports() {
  const a = new EventEmitter();
  const b = new EventEmitter();

  a.publish = (topic, msg) => {
    b.emit('message', 'aPub', msg);
  };
  a.subscribe = () => {};

  b.publish = (topic, msg) => {
    a.emit('message', 'bPub', msg);
  };
  b.subscribe = () => {};

  const transportA = rawr.transports.mqtt({
    connection: a,
    pubTopic: 'aPub',
    subTopic: 'bPub'
  });
  transportA.a = a;
  const transportB = rawr.transports.mqtt({
    connection: b,
    pubTopic: 'bPub',
    subTopic: 'aPub'
  });
  transportB.b = b;

  const transportDontSub = rawr.transports.mqtt({
    connection: a,
    pubTopic: 'aPub',
    subTopic: 'bPub',
    subscribe: false,
  });

  const transportBadTopic = rawr.transports.mqtt({
    connection: a,
    pubTopic: 'somethingElse',
    subTopic: 'somethingElse',
  });

  return { transportA, transportB, transportDontSub, transportBadTopic };
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

describe('mqtt', () => {
  it('should make a client', (done) => {
    const { transportA, transportB } = mockTransports();
    transportB.b.publish('bPub', 'check bad json');
    const client = rawr({ transport: transportA });
    client.should.be.a('object');
    client.addHandler.should.be.a('function');
    done();
  });

  it('should make a client with an already subscribed transport', (done) => {
    const { transportDontSub, transportB } = mockTransports();
    transportB.b.publish('bPub', 'check bad json');
    const client = rawr({ transport: transportDontSub });
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

  it('client should handle bad messages on topic', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA });
    const clientB = rawr({ transport: transportB, handlers: { subtract } });

    transportA.a.publish('aPub', `{"something": "bad"}`);
    const resultA = await clientA.methods.subtract(7, 2);
    resultA.should.equal(5);
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

  it('client handle an rpc timeout becuase topic didnt match', async () => {
    const { transportA, transportBadTopic } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportBadTopic, timeout: 10 });

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
