
(function(){
"use strict";

    var module = angular.module('chat', [
        'ngRoute',
        'chat.login',
        'chat.dash',
        'chat.directives']);

    module.
        factory('webSocket', function(){
            var path = "ws://" + location.host + "/" + "websocket";
            return new ReconnectingWebSocket(path);
        }).
        factory('$ws', function($rootScope, $q, connectorRegistry, webSocket){
            connectorRegistry.register(new TC.data_source.WSConnector(webSocket));
            return new TC.data_source.WS(
                $rootScope,
                $q,
                connectorRegistry,
                webSocket);
        }).
        factory('$sid', function(){
            return new TC.session.SessionStorage();
        }).
        factory("$ds", function($ws, $sid){
            return new TC.data_source.Sid($ws, $sid);
        }).
        factory('$connection', function($ds, $sid, $rootScope){
            return new TC.login.Connection($ds, $sid, $rootScope);
        }).
        factory('connectorRegistry', function(){
            return new TC.data_source.ConnectorRegistry();
        }).
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
    run(function($ds, $rootScope, db){
        $ds.open('websocket');
        console.log($rootScope);
        $rootScope.DB = db;
    });

})();