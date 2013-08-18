
(function(){
"use strict";

    var module = angular.module('login', []);

    module.
        factory('$ws', function(){
            var ws_inst;

            ws_inst = new TC.WS();
            return ws_inst;
        }).
        factory('$connection', function($ws){
            var connection = TC.Connection.create($ws);
            console.log("Created connection instance", connection, $ws);
            return connection;
        });

    var LoginCtrl = function($scope, $routeParams, $connection) {
        $scope.username = '';
        $scope.password = '';

        $scope.login = function(){
            $connection.login($scope.username, $scope.password);
        }

        $scope.register = function(){
            $connection.register($scope.username, $scope.password);
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