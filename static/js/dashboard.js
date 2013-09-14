(function(){
    "use strict";

    TC.Contacts = TC.Class(TC.Table, {
        name: 'contacts'
    });

    var module = angular.module('chat.dash', []);

    module.
        factory('$contacts', function($ds){
            return TC.Contacts.create($ds);
        });


    var DashCtrl = function($scope, $connection, $location, $contacts) {
        var query = $contacts.query();
        $scope.contacts = query.load().items();

        $scope.name = '';
        $scope.talk = function(){
            if ($scope.name){
                $location.path('/chat/' + $scope.name);
            } else {
                $scope.error = "You need to enter name";
            }
        }
    };

    module.
      config(['$routeProvider', function($routeProvider) {
      $routeProvider.
          when('/dash', {templateUrl: 'static/partials/dash.html', controller: TC.DashCtrl})
    }]);

    TC.DashCtrl = DashCtrl;
})();