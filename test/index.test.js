import { describe, it, expect } from 'vitest';
import EventEmitter from 'eventemitter3';
import { generateId } from 'b64id';
import rawr from '../index.js';

function mockTransports() {
  const a = new EventEmitter();
  const b = new EventEmitter();

  a.on('message', (msg) => {
    a.emit('rpc', msg);
  });
  a.send = (msg, config) => {
    b.emit('message', msg);
    if (config) {
      b.emit('config', config);
    }
  };

  b.on('message', (msg) => {
    b.emit('rpc', msg);
  });
  b.send = (msg, config) => {
    if (config) {
      a.emit('config', config);
    }
    a.emit('message', msg);
  };

  return { a, b };
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

function slowFunction() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('slow');
    }, 300);
  });
}

function hi() {
  return 'hi';
}

describe('rawr', () => {
  it('should make a client', () => {
    const client = rawr({ transport: mockTransports().a });
    expect(client).toBeTypeOf('object');
    expect(client.addHandler).toBeTypeOf('function');
  });

  it('client should make a successful rpc call to another peer', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a, handlers: { add } });
    const clientB = rawr({ transport: b, handlers: { subtract } });

    const resultA = await clientA.methods.subtract(7, 2);
    const resultB = await clientB.methods.add(1, 2);
    expect(resultA).toBe(5);
    expect(resultB).toBe(3);
  });

  it('client should make a successful rpc call to another peer with custom id generators', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a, handlers: { add }, idGenerator: generateId });
    const clientB = rawr({ transport: b, handlers: { subtract }, idGenerator: generateId });

    const resultA = await clientA.methods.subtract(7, 2);
    const resultB = await clientB.methods.add(1, 2);
    expect(resultA).toBe(5);
    expect(resultB).toBe(3);
  });

  it('client should make an unsuccessful rpc call to a peer', async () => {
    const { a, b } = mockTransports();
    rawr({ transport: a, handlers: { helloTest } });
    const clientB = rawr({ transport: b });

    try {
      await clientB.methods.helloTest('bad');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(9000);
    }
  });

  it('client handle an rpc under a specified timeout', async () => {
    const { a, b } = mockTransports();
    rawr({ transport: a, handlers: { helloTest } });
    const clientB = rawr({ transport: b, timeout: 1000 });

    const result = await clientB.methods.helloTest('luis');
    expect(result).toBe('hello, luis');
  });

  it('client handle an rpc timeout', async () => {
    const { a, b } = mockTransports();
    rawr({ transport: a, handlers: { helloTest } });
    const clientB = rawr({ transport: b, timeout: 10 });

    try {
      await clientB.methods.helloTest('luis');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(504);
    }
  });

  it('client should be able to send a notification to a server', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a });
    const clientB = rawr({ transport: b });

    const received = new Promise((resolve) => {
      clientA.notifications.ondoSomething((someData) => {
        resolve(someData);
      });
    });

    clientB.notifiers.doSomething('testing_notification');

    const result = await received;
    expect(result).toBe('testing_notification');
  });

  it('client should have notifiersExt method', () => {
    const { a } = mockTransports();
    const client = rawr({ transport: a });
    expect(client).toHaveProperty('notifiersExt');
    expect(client.notifiersExt).toBeTypeOf('object');
  });

  it('client should be able to send a notification with notifiersExt', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a });
    const clientB = rawr({ transport: b });

    const received = new Promise((resolve) => {
      clientA.notifications.ondoSomething((someData) => {
        resolve(someData);
      });
    });

    clientB.notifiersExt.doSomething('testing_notification_ext');

    const result = await received;
    expect(result).toBe('testing_notification_ext');
  });

  it('client should pass config to transport when using notifiersExt', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a });
    const clientB = rawr({ transport: b });

    let receivedConfig = null;
    a.on('config', (config) => {
      receivedConfig = config;
    });

    const received = new Promise((resolve) => {
      clientA.notifications.ondoConfigTest((someData) => {
        resolve(someData);
      });
    });

    clientB.notifiersExt.doConfigTest('config_test', { postMessageOptions: { transfer: ['test'] } });

    const result = await received;
    expect(result).toBe('config_test');
    expect(receivedConfig).toEqual({ postMessageOptions: { transfer: ['test'] } });
  });

  it('client should fail on a configured timeout', async () => {
    const { a, b } = mockTransports();
    const clientA = rawr({ transport: a, handlers: { slowFunction, hi } });
    const clientB = rawr({ transport: b, handlers: { slowFunction, add } });

    // clientA calls slowFunction on clientB's handlers
    const resultA = await clientA.methodsExt.slowFunction({ timeout: 1000 });
    expect(resultA).toBe('slow');

    // clientA calls add on clientB's handlers
    const resultA2 = await clientA.methodsExt.add(1, 2, null);
    expect(resultA2).toBe(3);

    // clientB calls slowFunction on clientA's handlers, but times out
    try {
      await clientB.methodsExt.slowFunction({ timeout: 100 });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(504);
    }

    try {
      await clientB.methodsExt.slowFunction('useless param', { timeout: 100 });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.code).toBe(504);
    }

    const resultB2 = await clientB.methodsExt.hi();
    expect(resultB2).toBe('hi');
  });
});
