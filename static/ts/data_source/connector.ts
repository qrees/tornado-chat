/// <reference path="../references.ts"/>

module TC.data_source {

    export class ConnectorRegistry extends TC.utils.ListRegistry<Connector> { }

    export interface Connector {
        handle(queue: TC.rest.RestRequest[]): TC.rest.RestRequest[];
    }

    export class WSConnector implements Connector {
        constructor(private ws: ReconnectingWebSocket){
            if(ws === null || ws === undefined)
                throw Error("ws cannot be null or undefined");
        }

        private matches(message:TC.rest.RestRequest): boolean {
            return true;
        }

        handle(queue: TC.rest.RestRequest[]): TC.rest.RestRequest[] {
            var processed: TC.rest.RestRequest[] = [];

            if(this.ws.readyState === WebSocket.OPEN){
                for (var i:number = 0; i < queue.length; i++){
                    var message: TC.rest.RestRequest = queue[i];
                    if(!this.matches(message))
                        continue;
                    this.send(message);
                    processed.push(message);
                }
            }else{
                console.warn("WebSocket is not open, skipping queue");
            }
            return processed;
        }

        private send(message:TC.rest.RestRequest): void {
            console.log("OUT", message.stringify());
            var str: string = message.stringify();
            this.ws.send(str);
        }
    }

}
