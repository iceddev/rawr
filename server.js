(function(factory){
  /*jshint strict:false */
  if(typeof define != "undefined"){
    define(['meld'], factory);
  }else if(typeof module != "undefined"){
    module.exports = factory(require('meld'));
  }else{
    Nodoze = factory();
  }
})(function(meld){

  'use strict';

  function Rawr(server, funcs){
    var sockets = server.sockets ? server.sockets : server;

    this.functions = funcs || Rawr.prototype.functions;

    var self = this;

    sockets.on('connection', function (socket) {

      // Generate the SMD and send it on connection
      for(var func in self.functions){
        self.smd.services[func] = {};
      }
      socket.send(JSON.stringify({smd: self.smd}));

      function rpcEmit(result, error, id){
        socket.send(JSON.stringify({
          result: result,
          error: error,
          id: id
        }));
      }

      // On rpc call, execute the function
      socket.on('message', function(data){
        data = JSON.parse(data);

        if(self.functions[data.method]){
          var func = meld.afterReturning(self.functions[data.method], function(result){
            if(!result){
              return;
            }

            if(result && typeof result.then === 'function'){
              result.then(function(success){
                rpcEmit(success, null, data.id);
              }, function(error){
                rpcEmit(null, error, data.id);
              });
            } else {
              if(result.error){
                rpcEmit(null, result.error, data.id);
              } else {
                rpcEmit(result.result || result, null, data.id);
              }
            }
          });
          func.apply(socket, data.params);
        } else {
          rpcEmit(null, 'method undefined', data.id);
        }

      });

    });

    return this;
  }

  Rawr.prototype.functions = {};

  Rawr.prototype.smd = {
    target:"/jsonrpc", // this defines the URL to connect for the services
    transport:"POST", // We will use POST as the transport
    envelope:"JSON-RPC-1.0", // We will use JSON-RPC
    SMDVersion:"2.0",
    services: {}
  };

  return Rawr;

});