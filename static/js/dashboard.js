(function(){
    "use strict";

    var module = angular.module('chat.dash', []);

    module.run(function(tableRegistry){
        var factory = new TC.ModelFactory('contact', TC.models.Contact);

        tableRegistry.registerModel(factory);
    });

    var DashCtrl = function($scope, $connection, $location, db) {
        $scope.name = '';
        $scope.talk = function(){
            if ($scope.name){
                $location.path('/chat/' + $scope.name);
            } else {
                $scope.error = "You need to enter name";
            }
        };

        $scope.stream = db.stream('contact');
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/dash', {templateUrl: 'static/partials/dash.html', controller: TC.DashCtrl})
    }]);

    TC.DashCtrl = DashCtrl;
})();