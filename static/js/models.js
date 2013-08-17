(function () {
    "use strict";

    TC.Connection = TC.Class(TC.Object, {
        init: function ($ws) {
            this.super();
            this.$ws = $ws;
        },
        open: function (path) {
            this.$ws.open(path);
        },
        login: function (username, password) {
            this.$ws.send('login', {
                "username": username,
                "password": password
            });
        }
    });

})();
