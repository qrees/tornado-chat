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

        var unauthorized_event_id = $scope.DB.$events['unauthorized'].register(unauthorizedListener);

        $scope.$on('$destroy', function() {
            $scope.DB.$events['unauthorized'].unregister(unauthorized_event_id)
        });
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/dash', {templateUrl: 'static/partials/dash.html', controller: TC.DashCtrl})
    }]);

    TC.DashCtrl = DashCtrl;
})();