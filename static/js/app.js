
(function(){
"use strict";

    var module = angular.module('chat', ['chat.login', 'chat.dash']);

    module.
        factory('$ws', TC.WS.create).
        factory('$sid', TC.SessionStorage.create).
        factory("$ds", function($ws, $sid){
            return TC.SidDataSource.create($ws, $sid);
        }).
        factory('$connection', TC.Connection.create);

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/chat/:chatId', {templateUrl: 'static/partials/chat.html', controller: TC.ChatCtrl}).
          otherwise({redirectTo: '/login'});
    }]).
    run([ "$ds", function($ds){
        $ds.open('websocket');
    }]);

})();