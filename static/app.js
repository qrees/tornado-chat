
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