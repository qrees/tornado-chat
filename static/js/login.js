(function(){
    "use strict";

    var module = angular.module('chat.login', []);

    TC.LoginCtrl = function($scope, $routeParams, $connection, $location) {
        $scope.username = '';
        $scope.password = '';

        $scope.login = function(){
            $connection.login($scope.username, $scope.password);
        };

        $scope.register = function(){
            $connection.register($scope.username, $scope.password);
        };

        var statusListener = function(statusEvent){
            if(statusEvent.getStatus() == TC.login.ConnectionStatus.AUTHENTICATED){
                console.log("Redirect to /dash");
                $location.path('/dash')
            }
        };

        var status_event_id = $connection.event_status.register(statusListener);

        $scope.$on('$routeChangeStart', function() {
            $connection.event_status.unregister(statusListener)
        });
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/login', {templateUrl: 'static/partials/login.html',   controller: TC.LoginCtrl})
    }]);

})();