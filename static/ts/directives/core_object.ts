///<reference path="../references.ts"/>

module TC.directives {

    console.log("Define chat.directives");
    var module: ng.IModule = angular.module('chat.directives', []);

    console.log("chat.directives", module);

    interface CoreObjectAttributes extends ng.IAttributes {
        resource: string;
        resourceConst: string;
        id: string;
        var: string;
    }

    interface DBScope extends ng.IScope {
        DB: TC.DB;
        [index: string]: any;
    }

    function coreObject(): ng.IDirective {
        return {
            'templateUrl': null,
            'scope': true,
            'restrict': 'EA',
            'replace': false,
            'transclude': false,
            link: function(scope: DBScope, iElement: ng.IAugmentedJQuery, _iAttrs: ng.IAttributes): void {
                var iAttrs: CoreObjectAttributes = <CoreObjectAttributes> _iAttrs;
                var DB: TC.DB = scope.DB;
                var var_: string = iAttrs.var || 'object';
                console.log("coreObject directive requested", iAttrs);

                var resource = function(): string {
                    if(iAttrs.resource)
                        return scope.$eval(iAttrs.resource)
                    else
                    if(iAttrs.resourceConst)
                        return iAttrs.resourceConst;
                    else
                        throw new Error("core-object directive requires 'resource' or 'resourceConst' attribute");
                };

                var id = function(): string {
                    return scope.$eval(iAttrs.id);
                };

                var collect = function() {
                    var objectId: string = id();
                    var objectResource: string = resource();
                    var DB: TC.DB = scope.DB;
                    var object: TC.Model = DB.getOrCreateModel(objectResource, objectId);
                    object.load();
                    scope[var_] = object;
                };

                var on_changed_event_id: string;
                var destroy = function() {
                    DB.onChangedEvent.unregister(on_changed_event_id);
                };
                on_changed_event_id = DB.onChangedEvent.register(collect);
                scope.$watch(resource, collect);
                scope.$watch(id, collect);
                scope.$on('$destroy', destroy);
            }
        }
    }
    console.log("Registering coreObject directive");
    module.directive('coreObject', coreObject);
}
