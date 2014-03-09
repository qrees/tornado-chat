
(function(){
"use strict";

    var module = angular.module('chat', [
        'chat.login',
        'chat.dash',
        'chat.directives']);

    module.
        factory('$ws', function($q){
            return new TC.data_source.WS($q);
        }).
        factory('$sid', TC.SessionStorage.create).
        factory("$ds", function($ws, $sid){
            return TC.SidDataSource.create($ws, $sid);
        }).
        factory('$connection', TC.Connection.create).
        factory('tableRegistry', function(){
            return new TC.ModelRegistry();
        }).
        service('db', function($ds, tableRegistry){
            return new TC.DB($ds, tableRegistry);
        });

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