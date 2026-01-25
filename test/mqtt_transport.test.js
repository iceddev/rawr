import { describe, it, expect } from 'vitest';
import EventEmitter from 'eventemitter3';
import rawr, { transports } from '../index.js';

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

  const transportA = transports.mqtt({
    connection: a,
    pubTopic: 'aPub',
    subTopic: 'bPub'
  });
  transportA.a = a;
  const transportB = transports.mqtt({
    connection: b,
    pubTopic: 'bPub',
    subTopic: 'aPub'
  });
  transportB.b = b;

  const transportDontSub = transports.mqtt({
    connection: a,
    pubTopic: 'aPub',
    subTopic: 'bPub',
    subscribe: false,
  });

  const transportBadTopic = transports.mqtt({
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

describe('mqtt transport', () => {
  it('should make a client', () => {
    const { transportA, transportB } = mockTransports();
    transportB.b.publish('bPub', 'check bad json');
    const client = rawr({ transport: transportA });
    expect(client).toBeTypeOf('object');
    expect(client.addHandler).toBeTypeOf('function');
  });

  it('should make a client with an already subscribed transport', () => {
    const { transportDontSub, transportB } = mockTransports();
    transportB.b.publish('bPub', 'check bad json');
    const client = rawr({ transport: transportDontSub });
    expect(client).toBeTypeOf('object');
    expect(client.addHandler).toBeTypeOf('function');
  });

  it('client should make a successful rpc call to another peer', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA, handlers: { add } });
    const clientB = rawr({ transport: transportB, handlers: { subtract } });

    const resultA = await clientA.methods.subtract(7, 2);
    const resultB = await clientB.methods.add(1, 2);
    expect(resultA).toBe(5);
    expect(resultB).toBe(3);
  });

  it('client should handle bad messages on topic', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA });
    rawr({ transport: transportB, handlers: { subtract } });

    transportA.a.publish('aPub', `{"something": "bad"}`);
    const resultA = await clientA.methods.subtract(7, 2);
    expect(resultA).toBe(5);
  });

  it('client should make an unsuccessful rpc call to a peer', async () => {
    const { transportA, transportB } = mockTransports();
    rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB });

    try {
      await clientB.methods.helloTest('bad');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(9000);
    }
  });

  it('client handle an rpc under a specified timeout', async () => {
    const { transportA, transportB } = mockTransports();
    rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB, timeout: 1000 });

    const result = await clientB.methods.helloTest('luis');
    expect(result).toBe('hello, luis');
  });

  it('client handle an rpc timeout', async () => {
    const { transportA, transportB } = mockTransports();
    rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportB, timeout: 10 });

    try {
      await clientB.methods.helloTest('luis');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(504);
    }
  });

  it('client handle an rpc timeout because topic didnt match', async () => {
    const { transportA, transportBadTopic } = mockTransports();
    rawr({ transport: transportA, handlers: { helloTest } });
    const clientB = rawr({ transport: transportBadTopic, timeout: 10 });

    try {
      await clientB.methods.helloTest('luis');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(504);
    }
  });

  it('client should be able to send a notification to a server', async () => {
    const { transportA, transportB } = mockTransports();
    const clientA = rawr({ transport: transportA });
    const clientB = rawr({ transport: transportB });

    const received = new Promise((resolve) => {
      clientA.notifications.ondoSomething((someData) => {
        resolve(someData);
      });
    });

    clientB.notifiers.doSomething('testing_notification');

    const result = await received;
    expect(result).toBe('testing_notification');
  });
});
