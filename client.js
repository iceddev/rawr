(function(define){
  'use strict';

  define(function(require){

    var when = require('when');

    function Rawr(socket){

      var self = this;

      var rejecter, resolver;
      self.promise = when.promise(function(resolve, reject, notify) {
        resolver = resolve;
        rejecter = reject;
      });

      // Make sure we have a socket with send and on
      if(!(socket && socket.send)){
        return rejecter('Must pass in a socket or an object with a socket property to this cosntructor. ex: {socket : mySocket}');
      }


      self.socket = socket;
      self.methods = {};

      var _callNum = 0;
      var _deferreds = {};

      function generateRpc(name, socket){
        return function(){
          var deferred = when.defer();
          _deferreds[++_callNum] = deferred;
          socket.send(JSON.stringify({
            method: name,
            params: Array.prototype.slice.call(arguments),
            id: _callNum
          }));
          return deferred.promise;
        };
      }

      // TODO: implement notifications

      function smdHandler(smd){

        if(!(smd && smd.services)){
          return rejecter('Malformed SMD - missing services');
        }

        for(var service in smd.services){
          self.methods[service] = generateRpc(service, self.socket);
        }

        return resolver(self.methods);
      }

      function rpcHandler(rpc){
        if(!(rpc.id && (rpc.error || rpc.result))){
          return;
        }

        var id = rpc.id;
        if(_deferreds[id]){
          var defer = _deferreds[id];
          if(rpc.error){
            defer.reject(rpc.error);
          } else {
            defer.resolve(rpc.result);
          }
          delete _deferreds[id];
        }
      }

      function handleMessage(data){
        if(data.smd){
          smdHandler(data.smd);
        } else {
          rpcHandler(data);
        }
      }

      if(!this.socket.on){
        this.socket.addEventListener('message', function(evt){
          var data = JSON.parse(evt.data);
          handleMessage(data);
        });
      } else {
        this.socket.on('message', function(data){
          data = JSON.parse(data);
          handleMessage(data);
        });
      }

    }

    return Rawr;

  });

}(
  typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
  // Boilerplate for AMD and Node
));
