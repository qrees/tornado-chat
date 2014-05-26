(function(){
    "use strict";

    var module = angular.module('chat.dash', []);

    module.run(function(tableRegistry){
        var factory = new TC.ModelFactory('contact', TC.models.Contact);

        tableRegistry.registerModel(factory);
    });

    var DashCtrl = function($scope, $connection, $location) {
        $scope.name = '';
        $scope.talk = function(){
            if ($scope.name){
                $location.path('/chat/' + $scope.name);
            } else {
                $scope.error = "You need to enter name";
            }
        };

        $scope.stream = $scope.DB.stream('contact');
        var unauthorizedListener = function unauthorizedListener(){
            console.log("User not logged in, redirecting to /login");
            $location.path('/login');
        }
        $scope.DB.events['unauthorized'].register(unauthorizedListener);
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/dash', {templateUrl: 'static/partials/dash.html', controller: TC.DashCtrl})
    }]);

    TC.DashCtrl = DashCtrl;
})();