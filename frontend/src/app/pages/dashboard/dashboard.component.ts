import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, selectBusinessState, selectAuthState } from '../../store/app.state';

import { Observable } from 'rxjs';

import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
  CalendarDayViewBeforeRenderEvent,
} from 'angular-calendar';


import getUnixTime from 'date-fns/getUnixTime';
import isWithinRange from 'date-fns/isWithinInterval';

import { Subject } from 'rxjs';

import {
  Get as GetReservations,
  Insert as InsertReservation,
  Update as UpdateReservation
} from '../../store/actions/reservations.actions';

import { Get as GetBusiness } from '../../store/actions/business.actions';
import { Get as GetServices } from '../../store/actions/services.actions';

import { Reservation } from '../../models/reservation';
import { Service } from '../../models/service';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalReservationComponent } from '../../common/modals/reservation/reservation.component';
import { ModalUpdateComponent } from '../../common/modals/update/update.component';

import {
  customDateParser,
  isValidDate,
  dateToString,
  itsGone,
  getDayStartEnd,
  showItemInList,
  colors
} from '../../common/utils';
import { ToastrService } from 'ngx-toastr';

import { User } from 'src/app/models/user';
import { Status, Logout, Update as UpdateUser } from '../../store/actions/auth.actions';
import { Business } from '../../models/business';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  refresh: Subject<any> = new Subject();
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  clickedDate: Date;
  clickedColumn: number;

  events: CalendarEvent[] = [];
  reservations: Reservation[] = [];

  dayStartHour = 6;
  dayEndHour = 22;

  business: Business;
  timeTable: any[] = [];
  todayIsClose = false;
  services: Service[] = [];

  weekStartsOn = 1;

  currentState$: Observable<any>;
  authState$: Observable<any>;

  isLoading: boolean;
  dispose: any;

  currentUser: User = null;

  activeTab = 1;

  form: any;

  constructor(
    private store: Store<AppState>,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {
    this.currentState$ = this.store.select(selectBusinessState);
    this.authState$ = this.store.select(selectAuthState);
  }

  ngOnInit(): void {
    this.store.dispatch(new Status());
    this.authState$.subscribe((state: any) => {
      if (state.isLoading === false && state.user) { this.currentUser = { ... state.user }; }
    });

    this.dispose = this.currentState$.subscribe((state) => {
      this.isLoading = state.isLoading;
      if (state.isLoading === false){
        if (state.response?.error === true && this.dispose) { this.dispose.unsubscribe(); }
        else if (this.timeTable.length === 0 && state.business === null) { this.store.dispatch(new GetBusiness()); }
        else if (this.services.length === 0 && state.business !== null && !state.services ) { this.store.dispatch(new GetServices()); }
        else if (this.events.length === 0 && state.business !== null && !state.reservations ) {
          this.store.dispatch(new GetReservations({}));
        }
      }

      if (state.business?.timeTable){
        this.business = state.business;
        this.timeTable = state.business.timeTable;
      }  // Local reference please :)
      if (state.services) { this.services = state.services; }  // Local reference please :)
      if (state.reservations && this.currentUser){
        this.events = state.reservations?.map((reservation: Reservation) => {
            const sameOwner = reservation.customer.id === this.currentUser.id;
            const isPending = reservation.isApproved === false && reservation.isReject === false;
            const editable = isPending && !itsGone(reservation.start) && reservation.customer.id === this.currentUser.id;
            return {
              start: new Date(reservation.start),
              end: new Date(reservation.end),
              title: !sameOwner ? '' :
                (
                  this.joinServices(reservation.services) +
                  ' Cliente: ' + reservation.customer.fullName +
                  ( reservation.note ? ' Note: ' + reservation.note : '')
                ),
              color: !sameOwner ? colors.blue :
                ( isPending ? colors.yellow :
                  ( reservation.isApproved === true ? colors.green : colors.red )
                ),
              actions: [],
              allDay: false,
              resizable: { beforeStart: false, afterEnd: false },
              draggable: editable,
              meta: reservation
            };
        });
        // Hide the events in calendar if are rejected
        if (this.activeTab === 1) { this.events = this.events.filter(event => event.meta.isReject === false); }
        this.reservations = [ ... state.reservations.filter(
          (event: Reservation) => this.activeTab !== 2 ?
          event :
          showItemInList(this.view, this.viewDate, new Date(event.start))
        )];
        this.recalculateStoreOpenClose(this.view === 'week' ? false : true);
      }
    });
  }

  joinServices(services: Service[]): string {
    return services.map((service: Service) => service.name).join(', ');
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.viewDate = date;
    this.view = CalendarView.Day;
    this.recalculateStoreOpenClose(true);
  }

  recalculateStoreOpenClose(single = true): void{
    const values = getDayStartEnd(this.timeTable, this.viewDate, single);
    this.dayStartHour = values.min;
    this.dayEndHour = values.max;
    this.todayIsClose = this.dayStartHour === Infinity && this.dayEndHour === -Infinity && this.view === 'day' ? true : false;
  }

  newReservation(date: Date): void {
    const modalRef = this.modalService.open(ModalReservationComponent, { size: 'md', centered: false });
    modalRef.componentInstance.date = date;
    modalRef.componentInstance.services = this.services;
    modalRef.componentInstance.business = this.business;
    modalRef.componentInstance.isAdmin = false;
    modalRef.result.then((result) => {
      if (result instanceof Reservation) { this.store.dispatch(new InsertReservation(result)); }
    }).catch((error: any) => { console.log(error); });
  }

  editReservation(reservation: Reservation): void{
    if (reservation.customer.id === this.currentUser.id){
      const modalRef = this.modalService.open(ModalReservationComponent, { size: 'md', centered: false });
      modalRef.componentInstance.reservation = {... reservation};
      modalRef.componentInstance.services = this.services;
      modalRef.componentInstance.business = this.business;
      modalRef.componentInstance.isAdmin = false;
      modalRef.result.then((result) => {
        if (result instanceof Reservation || typeof(result) === 'object') { this.store.dispatch(new UpdateReservation(result)); }
      }).catch((error: any) => { console.log(error); });
    }
  }

  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    if (itsGone(newStart)) { this.toastr.error('Non puoi inserire un evento nel passato', 'Ops!'); }
    else if (isValidDate(newStart, this.timeTable) === true && isValidDate(newEnd, this.timeTable) === true) {
      this.events = this.events.map((iEvent) => {
        if (iEvent === event) { return { ...event, start: newStart, end: newEnd, }; }
        return iEvent;
      });

      const reservation: Reservation = {... event.meta};
      reservation.start = dateToString(newStart);
      reservation.end = dateToString(newEnd);
      this.store.dispatch(new UpdateReservation(reservation));
    }else {
      this.toastr.error('La data inserita non sembra esser valida. Il negozio e\' chiuso', 'Ops!');
      this.refresh.next();
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.editReservation({
      ... event.meta,
      start: dateToString(event.start),
      end: dateToString(event.end)
    });
  }

  fetchReservation(): void{
    const timestamp = getUnixTime(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1));
    this.store.dispatch(new GetReservations( this.activeTab !== 2 ? {timestamp} : { timestamp, customerId: this.currentUser.id }));
  }

  disableDayHours(renderEvent: CalendarWeekViewBeforeRenderEvent): void {
    renderEvent.hourColumns.forEach(hourColumn => {
      hourColumn.hours.forEach(hour => {
        hour.segments.forEach(segment => {
          const processed: any = [];
          this.timeTable.map((value: any, index: number) => {
            if ((index + 1) % 7 === segment.date.getDay()){

              ['morning', 'afternoon'].map((type: string) => {

                if (value[type].open !== null && value[type].close !== null){

                  const open = customDateParser(segment.date, value[type].open);
                  const close = customDateParser(segment.date, value[type].close);

                  if (!isWithinRange( segment.date, { start: open, end: close } )){
                    if (processed.indexOf(segment.date) === -1){ segment.cssClass = 'cal-disabled'; }
                  } else {
                    processed.push(segment.date);
                    segment.cssClass = undefined;
                  }
                }
                else { if (processed.indexOf(segment.date) === -1) { segment.cssClass = 'cal-disabled'; } }
              });
            }
          });
        });
      });
    });
  }

  handleHourClick(date: Date): void{
    if (itsGone(date)) { this.toastr.error('Non puoi inserire un evento nel passato', 'Ops!'); }
    else if (isValidDate(date, this.timeTable) === true) { this.newReservation(date); }
  }

  beforeWeekViewRender(renderEvent: CalendarWeekViewBeforeRenderEvent): void {
    this.disableDayHours(renderEvent);
  }

  beforeDayViewRender(renderEvent: CalendarDayViewBeforeRenderEvent): void {
    this.disableDayHours(renderEvent);
  }

  logout(): void {
    this.store.dispatch(new Logout());
  }

  updateUser(action: string): void{
    const modalRef = this.modalService.open(ModalUpdateComponent, { size: 'md', centered: false });
    modalRef.componentInstance.action = action;
    modalRef.result.then((result) => {
      if (typeof(result) === 'object') { this.store.dispatch(new UpdateUser({... result, action})); }
    }).catch((error: any) => { console.log(error); });
  }

}

