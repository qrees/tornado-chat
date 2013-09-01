
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

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/login', {templateUrl: 'static/partials/login.html',   controller: TC.LoginCtrl}).
          when('/dash', {templateUrl: 'static/partials/dash.html', controller: TC.DashCtrl}).
          when('/chat/:chatId', {templateUrl: 'static/partials/chat.html', controller: TC.ChatCtrl}).
          otherwise({redirectTo: '/login'});
    }]).
    run([ "$connection", function($connection){
        $connection.open('websocket');
    }]);

})();