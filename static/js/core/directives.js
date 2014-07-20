
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
            link: function(scope, iElement, iAttrs){
//                var var_ = iAttrs['var'] || 'stream';

                var ref = function() {
                    return scope.$eval(iAttrs.ref);
                };

                var collect = function() {
                    var stream = ref();

                    if (stream) {
                        stream.load();
                    } else {
                        console.warn("Stream is None");
                    }
                };

                var on_changed_event_id;
                var destroy = function() {
                    scope.DB.onChangedEvent.unregister(on_changed_event_id);
                };
                on_changed_event_id = scope.DB.onChangedEvent.register(collect);
                scope.$watch(ref, collect);
                scope.$on('$destroy', destroy);
            }
        }
    };

    var coreAddForm = function coreAddForm(){
        return {
            'templateUrl': null,
            'scope': true,
            'restrict': 'EA',
            'replace': false,
            'transclude': false,
            controller: function($scope, $element, $attrs){
                var iAttrs = $attrs;
                var scope = $scope;
                var coreAddForm = {};
                $scope.coreAddForm = coreAddForm;
                var var_ = iAttrs['var'] || 'item';

                var ref = function() {
                    return scope.$eval(iAttrs.ref);
                };

                var item = function() {
                    return scope.$eval(var_);
                };

                var addItem = function() {
                    var stream = ref();
                    var response = stream.addItem(item());
                    response.then(function(){
                        console.log("addItem response", arguments);
                    })
                };

                var destroy = function(){
                    // TODO
                };

                scope.$on('$destroy', destroy);
                coreAddForm.submit = addItem;
            },
            link: function(scope, iElement, iAttrs, controller){

            }
        }
    };

    var coreAddButton = function coreAddButton(){
        return {
            'restrict': 'E',
            'template': '<button type="submit">Add</button>',
            'require': '^coreAddForm',
            link: function(scope, iElement, iAttrs, controller){
                var element = angular.element(iElement);
                element.bind('click', scope.coreAddForm.submit);
            }
        }
    };

    module.directive('coreAddForm', coreAddForm);
    module.directive('coreStream', coreStream);
    module.directive('coreAddButton', coreAddButton);
})();