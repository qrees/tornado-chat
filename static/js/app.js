
(function(){
"use strict";

    var module = angular.module('login', []);

    function WS() {
        var ws = null;
        var initial_timeout = 1000;
        var max_timeout = 8000;
        var timeout = 1000;
        var callbacks = {
            'open': {},
            'close': {},
            'message': {}
        };
        var status = WebSocket.CLOSED;
        var path = null;

        var onopen = function(evt){
            timeout = initial_timeout;
            console.log("Web socket opened", evt);
            status = WebSocket.OPENED;
        };

        var onclose = function(evt){
            console.log("Web socket closed", evt);
            status = WebSocket.CONNECTING;
            setTimeout(angular.bind(this, this._open, path), timeout);
            if(timeout * 2 < max_timeout)
                timeout = timeout * 2;
        };

        var onmessage = function(evt){
            console.log(evt);
        };

        this._open = function(_path){
            console.log("Opening websocket");
            path = _path;
            ws = new WebSocket(path);
            ws.onopen = angular.bind(this, onopen);
            ws.onclose = angular.bind(this, onclose);
            ws.onmessage = angular.bind(this, onmessage);
        };

        this.open = function(path){
            this._open("ws://"+location.host+"/" + path);
        };

        this.send = function(route, data, callback) {
            var id = Math.random().toString();
            if(callback) {
                callbacks['message'][id] = callback;
            }

            var message = {
               id: id,
               route: route,
               body: data
            };

            console.log("WebSocket send", message);
            ws.send(JSON.stringify(message));
        }
    }

    module.
        factory('$ws', function(){
            var ws_inst;

            ws_inst = new WS();
            return ws_inst;
        }).
        factory('$connection', function($ws){
            var connection = TC.Connection.create($ws);
            console.log("Created connection instance", connection, $ws);
            return connection;
        });

    var LoginCtrl = function($scope, $routeParams, $ws) {
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
    run([ "$connection", function($connection){
        $connection.open('websocket');
    }]);

})();