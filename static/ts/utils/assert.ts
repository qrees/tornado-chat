///<reference path="../references.ts"/>

module TC.utils {

    export class AssertionError{
        constructor(public message: string){

        }

        toString(): string{
            return this.message;
        }
    }

    export function assert(bool: boolean, message?: string){
        if(bool)
            return;

        throw new AssertionError(message);
    }
}