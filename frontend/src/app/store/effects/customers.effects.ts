import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { Actions, Effect, createEffect, ofType } from '@ngrx/effects';

import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { map, filter, scan, mergeMap, switchMap, tap, catchError, withLatestFrom } from 'rxjs/operators';

import { AuthService } from '../../providers/http-api/auth.service';
import { CustomersService } from '../../providers/http-api/customers.service';

import * as CustomersActions from '../actions/customers.actions';
import { ToastrService } from 'ngx-toastr';

import { Store } from '@ngrx/store';
import { AppState, selectBusinessState } from '../app.state';

@Injectable()
export class CustomersEffects {

    constructor(
        private actions$: Actions,
        private store$: Store<AppState>,
        private customersService: CustomersService,
        private toastr: ToastrService
    ) {}

    @Effect()
    Get: Observable<any> = this.actions$.pipe(
        ofType(CustomersActions.GET_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [CustomersActions.Get, any]) => {
                return this.customersService.get(state.business.id, action.payload).pipe(
                    map( (result: any) => new CustomersActions.GetSuccess(result) ),
                    catchError( error => of( new CustomersActions.GetFailed(error) ) )
                );
            })
        );

    @Effect()
    Update: Observable<any> = this.actions$.pipe(
        ofType(CustomersActions.UPDATE_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [CustomersActions.Update, any]) =>
            this.customersService.update({
                user: { ... action.payload, user_id: action.payload.id, is_admin: action.payload.isAdmin},
                business_id: state.business.id
            }).pipe(
                map( (result: any) => {
                    this.toastr.success('Aggiornamento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new CustomersActions.UpdateSuccess(result);
                } ),
                catchError( error => of( new CustomersActions.UpdateFailed(error) ) )
            ))
        );

    @Effect({ dispatch: false })
    Success: Observable<any> = this.actions$.pipe(
        ofType(CustomersActions.GET_SUCCESS, CustomersActions.UPDATE_SUCCESS, CustomersActions.INSERT_SUCCESS)
    );

    @Effect({ dispatch: false })
    Failed: Observable<any> = this.actions$.pipe(
        ofType(CustomersActions.GET_FAILED, CustomersActions.UPDATE_FAILED, CustomersActions.INSERT_FAILED)
    );
}
