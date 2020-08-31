import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { Actions, Effect, createEffect, ofType } from '@ngrx/effects';

import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { map, filter, scan, mergeMap, switchMap, tap, catchError } from 'rxjs/operators';

import { AuthService } from '../../providers/http-api/auth.service';
import { BusinessService } from '../../providers/http-api/business.service';

import * as BusinessActions from '../actions/business.actions';
import { ToastrService } from 'ngx-toastr';


@Injectable()
export class BusinessEffects {

    constructor(
        private actions$: Actions,
        private authService: AuthService,
        private businessService: BusinessService,
        private router: Router,
        private toastr: ToastrService
    ) {}

    @Effect()
    Get: Observable<any> = this.actions$.pipe(
        ofType(BusinessActions.GET_START),
        switchMap((action: BusinessActions.Get) =>
            this.businessService.get().pipe(
                map( (result: any) => new BusinessActions.GetSuccess(result) ),
                catchError( error => of( new BusinessActions.GetFailed(error) ) )
            ))
        );

    @Effect()
    Update: Observable<any> = this.actions$.pipe(
        ofType(BusinessActions.UPDATE_START),
        map((action: BusinessActions.Update) => action.payload),
        switchMap((payload =>
            this.businessService.update(payload).pipe(
                map( (result: any) => {
                    this.toastr.success('Aggiornamento completato con successo', 'Evviva!', { timeOut: 3000 });
                    return new BusinessActions.UpdateSuccess(result);
                } ),
                catchError( error => of( new BusinessActions.UpdateFailed(error) ) )
            ))
        )
    );

    @Effect({ dispatch: false })
    Success: Observable<any> = this.actions$.pipe(
        ofType(BusinessActions.GET_SUCCESS, BusinessActions.UPDATE_SUCCESS)
    );

    @Effect({ dispatch: false })
    Failed: Observable<any> = this.actions$.pipe(
        ofType(BusinessActions.GET_FAILED, BusinessActions.UPDATE_FAILED)
    );

}
