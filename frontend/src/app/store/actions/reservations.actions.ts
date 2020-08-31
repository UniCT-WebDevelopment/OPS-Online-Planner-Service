import { Action } from '@ngrx/store';

export const GET_START     = '[Reservations] Get Start';
export const GET_SUCCESS   = '[Reservations] Get Success';
export const GET_FAILED    = '[Reservations] Get Failed';

export const UPDATE_START        = '[Reservations] Update Start';
export const UPDATE_SUCCESS      = '[Reservations] Update Success';
export const UPDATE_FAILED       = '[Reservations] Update Failed';

export const INSERT_START        = '[Reservations] Insert Start';
export const INSERT_SUCCESS      = '[Reservations] Insert Success';
export const INSERT_FAILED       = '[Reservations] Insert Failed';

export const DELETE_START        = '[Reservations] Delete Start';
export const DELETE_SUCCESS      = '[Reservations] Delete Success';
export const DELETE_FAILED       = '[Reservations] Delete Failed';

export class Get implements Action {
    readonly type = GET_START;
    constructor(public payload: any = null) {}
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

export class Insert implements Action {
    readonly type = INSERT_START;
    constructor(public payload: any) {}
}

export class InsertSuccess implements Action {
    readonly type = INSERT_SUCCESS;
    constructor(public payload: any) {}
}

export class InsertFailed implements Action {
    readonly type = INSERT_FAILED;
    constructor(public payload: any) {}
}

export class Delete implements Action {
    readonly type = DELETE_START;
    constructor(public payload: any) {}
}

export class DeleteSuccess implements Action {
    readonly type = DELETE_SUCCESS;
    constructor(public payload: any) {}
}

export class DeleteFailed implements Action {
    readonly type = DELETE_FAILED;
    constructor(public payload: any) {}
}

export type All =
    | Get
    | GetSuccess
    | GetFailed

    | Update
    | UpdateSuccess
    | UpdateFailed

    | Insert
    | InsertSuccess
    | InsertFailed

    | Delete
    | DeleteSuccess
    | DeleteFailed;
