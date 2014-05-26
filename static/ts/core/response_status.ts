///<reference path="../references.ts"/>


// FIXME : keep in sync with common/business_logic.py
module TC.rest {

    export class ResponseStatus {
        public static STATUS_EXCEPTION: string = 'exception';
        public static STATUS_INVALID: string = 'invalid';
        public static STATUS_NOT_FOUND: string = 'not_found';
        public static STATUS_OK: string = 'ok';
        public static STATUS_UNAUTHORIZED: string = 'unauthorized';
        public static STATUS_UNSUPPORTED: string = 'unsupported';
    }
}
