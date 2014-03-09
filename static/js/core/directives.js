
(function(){
"use strict";

    var module = angular.module('chat.directives', []);

    var coreStream = function(){
        return {
            'templateUrl': null,
            'scope': true,
            'restrict': 'EA',
            'replace': false,
            'transclude': false,
            link: function(scope, iElement, iAttrs, controller){
//                var db = getDB();
                var var_ = iAttrs['var'] || 'stream';

                var ref = function() {
                    return scope.$eval(iAttrs.ref);
                };

                var collect = function() {
                    var stream = ref();

                    scope.$parent[var_] = stream;
                    if (stream) {
                        stream.load();
                    } else {
                        console.warn("Stream is None");
                    }
                };

                var destroy = function() {
//                    scope.ankhDb.onChangedEvent.unregister(collect);
                };

//                scope.ankhDb.onChangedEvent.register(collect);
                scope.$watch(ref, collect);
                scope.$on('$destroy', destroy);
            }
        }
    };

    module.directive('coreStream', coreStream);

})();