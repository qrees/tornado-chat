///<reference path="../references.ts"/>

module TC.data_source {

    export interface DataSource {
        open(): void

        get(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse>

        send(request: TC.rest.RestRequest): ng.IPromise<TC.rest.RestResponse>
    }
}