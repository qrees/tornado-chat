///<reference path="../references.ts"/>

module TC {

    export function assert(condition: boolean, message: string): void {
        if(condition) {

        } else {
            throw new Error(message);
        }
    }

    export function isNull(value: any): boolean {
        if (value === null || value === undefined) {
            return true;
        } else {
            return false;
        }
    }

    export interface Mapping {[key: string]: any}

    export class Filter {
        private $value: any;

        public get(): any {
            return this.$value;
        }

        public set(value: any){
            this.$value = value;
        }
    }

    export class Filters {
        private $filters: {[filter: string]: Filter} = {};

        public asDict(): Mapping {
            var filterName: string;
            var dict: {[filterName: string]: any} = {};

            for(filterName in this.$filters) {
                if(!this.$filters.hasOwnProperty(filterName)){
                    continue;
                }
                dict[filterName] = this.$filters[filterName].get();
            }
            return dict;
        }

        public set(filterName: string, value: any) {
            assert(!isNull(filterName), "filter name cannot be null");
            var filter: Filter;
            if(!(filterName in this.$filters)) {
                filter = new Filter();
                this.$filters[filterName] = filter;
            } else {
                filter = this.$filters[filterName];
            }
            filter.set(value);
        }
    }

    export class DB {
        private $dataSource: TC.data_source.DataSource;
        public $events: {[key: string]: TC.utils.EventDispatcher} = {};
        private $objCache: {
            [resource: string]: {
                [id: string]: Model
            }
        }
        private modelRegistry: TC.ModelRegistry;
        public onChangedEvent: TC.utils.EventDispatcher = new TC.utils.EventDispatcher();

        constructor(dataSource: TC.data_source.DataSource, modelRegistry: TC.ModelRegistry){
            this.$dataSource = dataSource;
            this.modelRegistry = modelRegistry;
            this.$events['unauthorized'] = new TC.utils.EventDispatcher();
            this.$objCache = {};
        }

        stream(resource: string): TC.Stream{
            var model_factory: TC.ModelFactory = this.modelRegistry.getModel(resource);
            return new TC.Stream(this, model_factory);
        }

        addItem(resource: string, data: Mapping): ng.IPromise<TC.rest.RestResponse> {
            TC.utils.assert(data !== undefined, "'data' cannot be undefined");
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                resource, data, TC.rest.RestActionType.SEND
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this.$dataSource.send(request);

            ws_deferred.then(this._handleAddResult.bind(this));
            return ws_deferred;
        }

        private _handleAddResult(response: TC.rest.RestResponse) {
            // TODO
            throw new Error("Not yet implemented");
        }

        runQuery(resource: string, filters: Filters): ng.IPromise<TC.rest.RestResponse>  {
            var request: TC.rest.RestRequest = new TC.rest.RestRequest(
                resource,
                filters.asDict(),
                TC.rest.RestActionType.GET
            );
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this.$dataSource.get(request);
            console.log("runQuery", ws_deferred);
            ws_deferred.then(this._handleQueryResult.bind(this));
            return ws_deferred;
        }

        public getModel(resource: string, id: string): Model {
            var resources: { [id: string]: Model };
            var model: Model;
            if (!(resource in this.$objCache)) {
                throw new Error("Missing resource: " + resource);
            } else {
                resources = this.$objCache[resource];
            }

            if (!(id in resources)) {
                throw new Error("Missing model in resource: " + resource + " " + id);
            } else {
                model = resources[id];
            }
            return model;
        }

        public getOrCreateModel(resource: string, id: string, value?: Mapping): Model {
            var resources: { [id: string]: Model };
            var model: Model;
            if (!(resource in this.$objCache)) {
                resources = {};
                this.$objCache[resource] = resources;
            } else {
                resources = this.$objCache[resource];
            }

            if (!(id in resources)) {
                console.log("DB: Creating new model: ", resource, id);
                var model_factory: TC.ModelFactory = this.modelRegistry.getModel(resource);
                model = model_factory.create(id, this);
                resources[id] = model;
            } else {
                console.log("DB: Model exists", resource, id);
                model = resources[id];
            }
            if (value != null && value != undefined) {
                model.update(value);
            }
            if(id !== model.getId()) {
                throw new Error("Received inconsistand data, requested model id " + id + " is not equal to received model id = " + model.getId());
            }
            return model;
        }

        private _handleQueryResult(value: TC.rest.RestResponse){
            console.log("DB._handleQueryResult");
            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_UNAUTHORIZED){
                console.warn("Received response with not ok status", value);
                this.$events['unauthorized'].trigger(new TC.utils.Event());
                return;
            }

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_OK){
                var data: any[] = value.getBody(); // FIXME : 'any' type

                if (!angular.isArray(data)) {
                    throw new Error("Expected array in response");
                }

                angular.forEach(data, (value: any) => { // FIXME : 'any' type
                    var id = value.$id;
                    var resource = value.$resource;
                    if (id === undefined || resource === undefined){
                        console.error("missing $id or $resource from data", value);
                        throw new Error("missing $id or $resource from data");
                    }
                    var model: TC.Model = this.getOrCreateModel(resource, id, value);
                });
                return;
            }

            throw new Error("Unsupported status: " + value.getStatus());
        }

    }

    export class ModelRegistry {
        private factory_registry: {[model_name: string]: TC.ModelFactory} = {};

        getModel(model_name: string): TC.ModelFactory {
            if (!(model_name in this.factory_registry)) {
                throw new Error(model_name + " was not registered as model");
            }

            return this.factory_registry[model_name];
        }

        registerModel(model_class: TC.ModelFactory) {
            var model_name: string = model_class.name;
            if (model_name in this.factory_registry) {
                throw new Error(model_name + " was already registered as model");
            }

            this.factory_registry[model_name] = model_class;
        }
    }

    export class ModelFactory {
        public name: string;
        private type: new(id: string, factory: ModelFactory, db:DB) => TC.Model;

        constructor(name: string, type: new(id: string, factory: ModelFactory, db:DB) => TC.Model){
            if (type === null || type === undefined){
                throw Error("ModelFactory type argument cannot be null or undefined");
            }

            this.type = type;
            this.name = name;
        }

        create(id: string, db: DB): TC.Model {
            return new this.type(id, this, db);
        }
    }

    export class Model {
        private resource: string;
        private id: string;
        private $factory: ModelFactory;
        private $db: DB;

        constructor(id: string, factory: ModelFactory, db: DB){ // FIXME : Mapping type is almost the as 'any'
            this.$factory = factory;
            this.$db = db;
            this.id = id;
        }

        public update(value: Mapping): void {
            if(value['$resource'] === null || value['$resource'] === undefined){
                throw new Error("Cannot update model with undefined resource");
            }
            if(value['$resource'] != this.$factory.name) {
                throw new Error("Invalid resource for factory: " + value['$resource'] + " expected: " + this.$factory.name);
            }
            if(value['$id'] === null || value['$id'] === undefined){
                throw new Error("Cannot update model with undefined id");
            }
            if(value['$id'] != this.id) {
                throw new Error("Invalid id for model: " + value['$id'] + " expected: " + this.id);
            }
            this.id = value['$id'];
            this.resource = value['$resource'];
        }

        public resourceName(){
            return 'resource.' + this.$factory.name;
        }

        public getFilters(): Filters {
            var filters: Filters = new Filters();
            filters.set('$id', this.id);
            return filters;
        }

        public getId(): string {
            return this.id;
        }

        public load(){
            this.$db.runQuery(
                this.resourceName(),
                this.getFilters()
            ).then(this._handleQueryResult.bind(this));
        }

        private _handleQueryResult(response: TC.rest.RestResponse): void {

        }
    }

    export class Stream {
        private $db: TC.DB;
        private $factory: TC.ModelFactory;
        private $filters: Filters;
        public $events: {
            [key: string]: TC.utils.EventDispatcher
        } = {};
        public objects: TC.Model[];

        constructor(db: TC.DB, factory: TC.ModelFactory){
            this.$db = db;
            this.$factory = factory;
            this.$filters = new Filters();
            this.$events['unauthorized'] = new TC.utils.EventDispatcher();
            this.objects = [];
        }

        public load(): void {
            this.$db.runQuery(
                this.resourceName(),
                this.getFilters()
            ).then(this._handleQueryResult.bind(this));
        }

        public addItem(data: Mapping): ng.IPromise<TC.rest.RestResponse> {
            TC.utils.assert(data !== undefined, "'data' cannot be undefined");
            var ws_deferred: ng.IPromise<TC.rest.RestResponse> = this.$db.addItem('resource.' + this.$factory.name, data);
            ws_deferred.then(this._handleAddResult.bind(this));
            return ws_deferred;
        }

        public resourceName(): string {
            return 'resource.' + this.$factory.name;
        }

        public pushObject(object: TC.Model): void {
            this.objects.push(object);
        }

        public getFilters(): Filters {
            return this.$filters;
        }

        private _handleAddResult(value: TC.rest.RestResponse){
            // TODO
        }

        private _handleQueryResult(value: TC.rest.RestResponse){

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_UNAUTHORIZED){
                console.warn("Received response with not ok status", value);
                this.$events['unauthorized'].trigger(new TC.utils.Event());
                return;
            }

            if (value.getStatus() === TC.rest.ResponseStatus.STATUS_OK){
                var data: any[] = value.getBody(); // FIXME : 'any' type
                console.info("Received stream", data);

                if (!angular.isArray(data)) {
                    throw new Error("Expected array in response");
                }

                angular.forEach(data, (value: any) => { // FIXME : 'any' type
                    var id = value.$id;
                    var resource = value.$resource;
                    if (id === undefined || resource === undefined){
                        console.error("missing $id or $resource from data", value);
                        throw new Error("missing $id or $resource from data");
                    }
                    var model: TC.Model = this.$db.getModel(resource, id);
                    this.pushObject(model);
                });
                return;
            }

            throw new Error("Unsupported status: " + value.getStatus());
        }
    }
}