import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { Actions, Effect, createEffect, ofType } from '@ngrx/effects';

import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { map, filter, scan, mergeMap, switchMap, tap, catchError, withLatestFrom } from 'rxjs/operators';

import { AuthService } from '../../providers/http-api/auth.service';
import { ServicesService } from '../../providers/http-api/services.service';

import * as ServicesActions from '../actions/services.actions';
import { ToastrService } from 'ngx-toastr';

import { Store } from '@ngrx/store';
import { AppState, selectBusinessState } from '../app.state';

@Injectable()
export class ServicesEffects {

    constructor(
        private actions$: Actions,
        private store$: Store<AppState>,
        private authService: AuthService,
        private servicesService: ServicesService,
        private router: Router,
        private toastr: ToastrService
    ) {}

    @Effect()
    Get: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.GET_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ServicesActions.Get, any]) => {
                return this.servicesService.get(state.business.id).pipe(
                    map( (result: any) => new ServicesActions.GetSuccess(result) ),
                    catchError( error => of( new ServicesActions.GetFailed(error) ) )
                );
            })
        );

    @Effect()
    Update: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.UPDATE_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ServicesActions.Update, any]) =>
            this.servicesService.update({... action.payload, duration_m: action.payload.durationM, business_id: state.business.id}).pipe(
                map( (result: any) => {
                    this.toastr.success('Aggiornamento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ServicesActions.UpdateSuccess(result);
                } ),
                catchError( error => of( new ServicesActions.UpdateFailed(error) ) )
            ))
        );

    @Effect()
    Insert: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.INSERT_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ServicesActions.Insert, any]) =>
            this.servicesService.insert({... action.payload, duration_m: action.payload.durationM, business_id: state.business.id}).pipe(
                map( (result: any) => {
                    this.toastr.success('Inserimento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ServicesActions.InsertSuccess(result);
                } ),
                catchError( error => of( new ServicesActions.InsertFailed(error) ) )
            ))
        );

    @Effect()
    Delete: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.DELETE_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ServicesActions.Delete, any]) =>
            this.servicesService.delete(action.payload.id, state.business.id).pipe(
                map( (result: any) => {
                    this.toastr.success('Servizio cancellato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ServicesActions.DeleteSuccess(result);
                } ),
                catchError( error => of( new ServicesActions.DeleteFailed(error) ) )
            ))
        );

    @Effect()
    DeleteSuccess: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.DELETE_SUCCESS),
        map((action: ServicesActions.All) => new ServicesActions.Get())
    );

    @Effect({ dispatch: false })
    Success: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.GET_SUCCESS, ServicesActions.UPDATE_SUCCESS, ServicesActions.INSERT_SUCCESS)
    );

    @Effect({ dispatch: false })
    Failed: Observable<any> = this.actions$.pipe(
        ofType(ServicesActions.GET_FAILED, ServicesActions.UPDATE_FAILED, ServicesActions.INSERT_FAILED)
    );
}
