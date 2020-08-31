import { Component, OnInit, ChangeDetectorRef, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, selectBusinessState } from '../../../store/app.state';

import { Observable } from 'rxjs';

import { Get as GetCustomers, Update as UpdateCustomer } from '../../../store/actions/customers.actions';
import { Get as GetBusiness } from '../../../store/actions/business.actions';
import { Get as GetReservations } from '../../../store/actions/reservations.actions';

import { User } from 'src/app/models/user';
import { Reservation } from 'src/app/models/reservation';
import { CalendarView } from 'angular-calendar';
import { showItemInList } from '../../../common/utils';

import getUnixTime from 'date-fns/getUnixTime';

@Component({
  selector: 'app-admin-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class AdminCustomersComponent implements OnInit {

  currentState$: Observable<any>;
  customers: User[] = [];
  dispose: any;

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  isLoading = false;
  query = '';

  selected: User;
  reservations: Reservation[];

  constructor(
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef
  ) {
    this.currentState$ = this.store.select(selectBusinessState);
  }

  ngOnInit(): void {
    this.dispose = this.currentState$.subscribe((state) => {
      this.isLoading = state.isLoading;
      if (state.isLoading === false){
        if (state.response?.error === true && this.dispose) { this.dispose.unsubscribe(); }
        else if (this.customers.length === 0 && state.business === null) {
          this.store.dispatch(new GetBusiness());
        }
        else if (this.customers.length === 0 && state.business !== null && !state.customers ) {
          this.store.dispatch(new GetCustomers(this.query));
        }
        else {
          if (state.customers){ this.customers = [ ... state.customers ]; }
          if (state.reservations){
            this.reservations = [ ... state.reservations.filter(
              (event: Reservation) => showItemInList(this.view, this.viewDate, new Date(event.start))
            )];
          }
        }
      }
    });
  }


  search(): void {
    if (this.isLoading === false){ // && this.query){
      this.selected = null;
      this.reservations = [];
      this.store.dispatch(new GetCustomers(this.query));
    }
  }

  select(user: User): void {
    this.selected = user;
    this.fetchReservation();
  }

  fetchReservation(): void{
    const timestamp = getUnixTime(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1));
    this.store.dispatch(new GetReservations({ timestamp, customerId: this.selected.id }));
  }

  update(values: any): void{
    if (typeof(values.isAdmin) === 'boolean') {
      this.selected = { ... this.selected, isAdmin: values.isAdmin };
      this.store.dispatch(new UpdateCustomer(this.selected));
    }
  }

}
