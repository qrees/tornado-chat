
(function(){
function websocket(){
    console.log(window.location);

    var ws = new WebSocket("ws://"+location.host+"/websocket");
    ws.onopen = function() {
       ws.send(JSON.stringify({
           id: Math.random().toString(),
           route: 'login',
           'body': {

           }
       }));
    };
    ws.onmessage = function (evt) {
       console.log(evt);
    };
};

angular.module('login', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/login', {templateUrl: 'partials/login.html',   controller: LoginCtrl}).
      otherwise({redirectTo: '/login'});
}]);

})();