'use strict';

var chai = require('chai');
var EventEmitter = require('events').EventEmitter;

chai.should();

var rawr = require('../');

function helloTest(name) {
  if(name === 'bad') {
    throw new Error('bad name !');
  }
  return 'hello, ' + name;
}

describe('rawr', function(){

  it('should make a client', function(done){
    var sendEE = new EventEmitter();
    var client = rawr.createClient({sendEmitter: sendEE});
    client.should.be.a('object');
    client.rpc.should.be.a('function');
    done();
  });

  it('should make a server', function(done){
    var sendEE = new EventEmitter();
    var server = rawr.createServer({sendEmitter: sendEE});
    server.should.be.a('object');
    server.addMethod.should.be.a('function');
    done();
  });

  it('client should make a successful rpc call to a server', function(done){
    var clientSendEE = new EventEmitter();
    var serverSendEE = new EventEmitter();
    var client = rawr.createClient({sendEmitter: clientSendEE, receiveEmitter: serverSendEE});
    var server = rawr.createServer({sendEmitter: serverSendEE, receiveEmitter: clientSendEE});

    server.addMethod('hello', helloTest);

    client.rpc('hello', 'luis')
      .then(function(result) {
        result.should.equal('hello, luis');
        done();
      });

  });

  it('client should make an unsuccessful rpc call to a server', function(done){
    var clientSendEE = new EventEmitter();
    var serverSendEE = new EventEmitter();
    var client = rawr.createClient({sendEmitter: clientSendEE, receiveEmitter: serverSendEE});
    var server = rawr.createServer({sendEmitter: serverSendEE, receiveEmitter: clientSendEE});

    server.addMethod('hello', helloTest);

    client.rpc('hello', 'bad')
      .catch(function(error) {
        done();
      });

  });

  it('client handle an rpc timeout', function(done){
    var clientSendEE = new EventEmitter();
    var client = rawr.createClient({sendEmitter: clientSendEE, timeout: 100});

    client.rpc('hello', 'bad')
      .catch(function(error) {
        done();
      });

  });

  it('client should be able to send a notification to a server', function(done){
    var clientSendEE = new EventEmitter();
    var serverSendEE = new EventEmitter();
    var client = rawr.createClient({sendEmitter: clientSendEE});
    var server = rawr.createServer({receiveEmitter: clientSendEE});

    server.notifications.on('yo', function(who) {
      who.should.equal('dawg');
      done();
    });

    client.notify('yo', 'dawg');

  });

  it('server should be able to send a notification to a client', function(done){
    var clientReceiveEE = new EventEmitter();
    var serverSendEE = new EventEmitter();
    var client = rawr.createClient({receiveEmitter: clientReceiveEE});
    var server = rawr.createServer({sendEmitter: clientReceiveEE});

    client.notifications.on('yo', function(who, when) {
      who.should.equal('dawg');
      when.should.equal('now');
      done();
    });

    server.notify('yo', 'dawg', 'now');

  });



});
