import { Action } from '@ngrx/store';

export const GET_START     = '[Business] Get Start';
export const GET_SUCCESS   = '[Business] Get Success';
export const GET_FAILED    = '[Business] Get Failed';

export const UPDATE_START        = '[Business] Update Start';
export const UPDATE_SUCCESS      = '[Business] Update Success';
export const UPDATE_FAILED       = '[Business] Update Failed';

export const RESET               = '[*] Reset';

export class Get implements Action {
    readonly type = GET_START;
    constructor() {}
}

export class GetSuccess implements Action {
    readonly type = GET_SUCCESS;
    constructor(public payload: any) {}
}

export class GetFailed implements Action {
    readonly type = GET_FAILED;
    constructor(public payload: any) {}
}

export class Update implements Action {
    readonly type = UPDATE_START;
    constructor(public payload: any) {}
}

export class UpdateSuccess implements Action {
    readonly type = UPDATE_SUCCESS;
    constructor(public payload: any) {}
}

export class UpdateFailed implements Action {
    readonly type = UPDATE_FAILED;
    constructor(public payload: any) {}
}

export class Reset implements Action {
    readonly type = RESET;
    constructor() {}
}

export type All =
    | Get
    | GetSuccess
    | GetFailed

    | Update
    | UpdateSuccess
    | UpdateFailed

    | Reset;
