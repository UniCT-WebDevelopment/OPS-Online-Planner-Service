import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AuthService } from './http-api/auth.service';

import { Store, select } from '@ngrx/store';
import { AppState, selectAuthState } from '../store/app.state';
import { Observable } from 'rxjs';
import { Status } from '../store/actions/auth.actions';

import { map, take, skipWhile } from 'rxjs/operators';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    public auth: AuthService,
    public router: Router
  ) {}
  canActivate(): boolean {
    if (!this.auth.getToken()) {
      this.router.navigateByUrl('/login');
      return false;
    }
    return true;
  }
}

@Injectable()
export class AuthAdminGuardService implements CanActivate {

  currentState$: Observable<any>;

  constructor(
    private store: Store<AppState>,
    public auth: AuthService,
    public router: Router
  ) { }
  canActivate(): Observable<boolean> {
    this.store.dispatch(new Status());
    return this.store.pipe(
      select(selectAuthState),
      skipWhile((state: any) => state.isLoading),
      map((state: any) => {
        // console.log(state);
        if (!this.auth.getToken() || !state.isAuthenticated || !state.user.isAdmin ) {
          this.router.navigateByUrl('/login');
          return false;
        }
        return true;
      })
    );
  }
}
