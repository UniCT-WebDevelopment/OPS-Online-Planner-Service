import { Action } from '@ngrx/store';

export const REGISTER_START     = '[Auth] Register Start';
export const REGISTER_SUCCESS   = '[Auth] Register Success';
export const REGISTER_FAILED    = '[Auth] Register Failed';

export const LOGIN_START        = '[Auth] Login Start';
export const LOGIN_SUCCESS      = '[Auth] Login Success';
export const LOGIN_FAILED       = '[Auth] Login Failed';

export const STATUS_START        = '[Auth] Status Start';
export const STATUS_SUCCESS      = '[Auth] Status Success';
export const STATUS_FAILED       = '[Auth] Status Failed';

export const LOGOUT_START        = '[Auth] Logout Start';
export const LOGOUT_SUCCESS      = '[Auth] Logout Success';
export const LOGOUT_FAILED       = '[Auth] Logout Failed';

export const UPDATE_START        = '[Auth] Update Start';
export const UPDATE_SUCCESS      = '[Auth] Update Success';
export const UPDATE_FAILED       = '[Auth] Update Failed';

export const PASSWORD_START        = '[Auth] Password Start';
export const PASSWORD_SUCCESS      = '[Auth] Password Success';
export const PASSWORD_FAILED       = '[Auth] Password Failed';

export class Register implements Action {
    readonly type = REGISTER_START;
    constructor(public payload: any) {}
}

export class RegisterSuccess implements Action {
    readonly type = REGISTER_SUCCESS;
    constructor(public payload: any) {}
}

export class RegisterFailed implements Action {
    readonly type = REGISTER_FAILED;
    constructor(public payload: any) {}
}

export class Login implements Action {
    readonly type = LOGIN_START;
    constructor(public payload: any) {}
}

export class LoginSuccess implements Action {
    readonly type = LOGIN_SUCCESS;
    constructor(public payload: any) {}
}

export class LoginFailed implements Action {
    readonly type = LOGIN_FAILED;
    constructor(public payload: any) {}
}

export class Status implements Action {
    readonly type = STATUS_START;
    constructor() {}
}

export class StatusSuccess implements Action {
    readonly type = STATUS_SUCCESS;
    constructor(public payload: any) {}
}

export class StatusFailed implements Action {
    readonly type = STATUS_FAILED;
    constructor(public payload: any) {}
}

export class Logout implements Action {
    readonly type = LOGOUT_START;
    constructor() {}
}

export class LogoutSuccess implements Action {
    readonly type = LOGOUT_SUCCESS;
    constructor(public payload: any) {}
}

export class LogoutFailed implements Action {
    readonly type = LOGOUT_FAILED;
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

export class Password implements Action {
    readonly type = PASSWORD_START;
    constructor(public payload: any) {}
}

export class PasswordSuccess implements Action {
    readonly type = PASSWORD_SUCCESS;
    constructor(public payload: any) {}
}

export class PasswordFailed implements Action {
    readonly type = PASSWORD_FAILED;
    constructor(public payload: any) {}
}

export type All =
    | Register
    | RegisterSuccess
    | RegisterFailed

    | Login
    | LoginSuccess
    | LoginFailed

    | Status
    | StatusSuccess
    | StatusFailed

    | Logout
    | LogoutSuccess
    | LogoutFailed

    | Update
    | UpdateSuccess
    | UpdateFailed

    | Password
    | PasswordSuccess
    | PasswordFailed;


