import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { Actions, Effect, createEffect, ofType } from '@ngrx/effects';

import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { map, filter, scan, mergeMap, switchMap, tap, catchError, withLatestFrom } from 'rxjs/operators';

import { AuthService } from '../../providers/http-api/auth.service';
import { ReservationsService } from '../../providers/http-api/reservations.service';

import * as ReservationsActions from '../actions/reservations.actions';
import { ToastrService } from 'ngx-toastr';

import { Store } from '@ngrx/store';
import { AppState, selectBusinessState } from '../app.state';
import { Service } from 'src/app/models/service';
import { Reservation } from 'src/app/models/reservation';


function parseReservation(item: Reservation): any{
    return {
        ... item,
        reservation_id: item.id,
        business_id: item.business.id,
        is_approved: item.isApproved && typeof(item.isApproved) === 'boolean' ?
            item.isApproved : false,
        is_reject: item.isReject && typeof(item.isReject) === 'boolean' ?
            item.isReject : false,
        services: item.services.map((service: Service) => ({ ... service, duration_m: service.durationM, service_id: service.serviceId }))
    };
}

@Injectable()
export class ReservationsEffects {

    constructor(
        private actions$: Actions,
        private store$: Store<AppState>,
        private authService: AuthService,
        private reservationsService: ReservationsService,
        private router: Router,
        private toastr: ToastrService
    ) {}

    @Effect()
    Get: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.GET_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ReservationsActions.Get, any]) =>
            this.reservationsService.get(state.business.id, action.payload.timestamp, action.payload.customerId).pipe(
                map( (result: any) => new ReservationsActions.GetSuccess(result) ),
                catchError( error => of( new ReservationsActions.GetFailed(error) ) )
            ))
        );

    @Effect()
    Update: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.UPDATE_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ReservationsActions.Update, any]) =>
            this.reservationsService.update(
                state.business.id,
                Array.isArray(action.payload) === true ?
                action.payload.map((item: Reservation) => { parseReservation(item); }) :
                [parseReservation(action.payload)]  // Create array with 1 elements
            ).pipe(
                map( (result: any) => {
                    this.toastr.success('Aggiornamento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ReservationsActions.UpdateSuccess(result);
                } ),
                catchError( error => of( new ReservationsActions.UpdateFailed(error) ) )
            ))
        );

    @Effect()
    Insert: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.INSERT_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ReservationsActions.Insert, any]) =>
            this.reservationsService.insert({
                ... action.payload,
                business_id: state.business.id,
                services: action.payload.services.map((service: Service) => {
                    return {... service, duration_m: service.durationM};
                })
            }).pipe(
                map( (result: any) => {
                    this.toastr.success('Inserimento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ReservationsActions.InsertSuccess(result);
                } ),
                catchError( error => of( new ReservationsActions.InsertFailed(error) ) )
            ))
        );

    /*
    @Effect()
    Delete: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.DELETE_START),
        withLatestFrom(this.store$.select(selectBusinessState)),
        mergeMap( ([action, state]: [ReservationsActions.Delete, any]) =>
            this.reservationsService.delete(action.payload.id, state.business.id).pipe(
                map( (result: any) => {
                    this.toastr.success('Appuntamento cancellato con successo', 'Evviva!', { timeOut: 3000 });
                    return new ReservationsActions.DeleteSuccess(result);
                } ),
                catchError( error => of( new ReservationsActions.DeleteFailed(error) ) )
            ))
        );
    */

    @Effect()
    DeleteSuccess: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.DELETE_SUCCESS),
        map((action: ReservationsActions.All) => new ReservationsActions.Get())
    );

    @Effect({ dispatch: false })
    Success: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.GET_SUCCESS, ReservationsActions.UPDATE_SUCCESS, ReservationsActions.INSERT_SUCCESS)
    );

    @Effect({ dispatch: false })
    Failed: Observable<any> = this.actions$.pipe(
        ofType(ReservationsActions.GET_FAILED, ReservationsActions.UPDATE_FAILED, ReservationsActions.INSERT_FAILED)
    );
}
