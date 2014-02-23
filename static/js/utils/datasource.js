(function(){
    TC.DataSource = TC.Class(TC.Observable, {
        open: function(){
            throw Error("Not implemented");
        },

        get: function(payload){
            throw Error("Not implemented");
        },

        send: function(payload){
            throw Error("Not implemented");
        }
    });
})();