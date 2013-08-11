
(function(){
"use strict";

    var module = angular.module('login', []);

    module.
        factory('$ws', function(){
            var ws_inst;
            function WS() {
                var ws = null;
                var callbacks = {
                    'open': {},
                    'close': {},
                    'message': {}
                };
                var status = WebSocket.CLOSED;

                var onopen = function(evt){

                }

                var onclose = function(evt){

                }

                var onmessage = function(evt){
                    console.log(evt);
                }

                this.open = function(path){
                    ws = new WebSocket("ws://"+location.host+"/" + path);
                    ws.onopen = onopen;
                    ws.onclose = onclose;
                    ws.onmessage = onmessage;
                }

                this.send = function(route, data, callback) {
                    var id = Math.random().toString();
                    if(callback) {
                        callbacks['message'][id] = callback;
                    }

                    var message = {
                       id: id,
                       route: route,
                       body: data
                    }

                    console.log("WebSocket send", message);
                    ws.send(JSON.stringify(message));
                }
            }

            ws_inst = new WS();
            return ws_inst;
        });

    function LoginCtrl($scope, $routeParams, $ws) {
        $scope.username = '';
        $scope.password = '';

        $scope.login = function(){
            $ws.send('login', {
                "username": $scope.username,
                "password": $scope.password
            })
        }
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/login', {templateUrl: 'static/partials/login.html',   controller: LoginCtrl}).
          otherwise({redirectTo: '/login'});
    }]).
    run([ "$ws", function($ws){
      $ws.open('websocket');
    }]);

})();