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

        var status_event_id = $connection.on('status', function(status){
            if(status == TC.CONNECTION_STATUS.AUTHENTICATED){
                console.log("Redirect to /dash");
                $location.path('/dash')
            }
        });

        $scope.$on('$routeChangeStart', function() {
            $connection.off(status_event_id)
        });
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/login', {templateUrl: 'static/partials/login.html',   controller: TC.LoginCtrl})
    }]);

})();