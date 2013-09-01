(function(){
    "use strict";

    var LoginCtrl = function($scope, $routeParams, $connection, $location) {
        $scope.username = '';
        $scope.password = '';

        $scope.login = function(){
            $connection.login($scope.username, $scope.password);
        }

        $scope.register = function(){
            $connection.register($scope.username, $scope.password);
        }

        var status_event_id = $connection.on('status', function(){
            debugger;
            $location.path('/dash')
        });

        console.log('test');

        $scope.$on('$routeChangeStart', function(next, current) {
            $connection.off(status_event_id)
        });
    };

    TC.LoginCtrl = LoginCtrl;
})();