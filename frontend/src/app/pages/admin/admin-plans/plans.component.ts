import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, selectBusinessState } from '../../../store/app.state';

import { Observable } from 'rxjs';

import {
  CalendarEvent,
  CalendarEventTitleFormatter,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent,
  CalendarDayViewBeforeRenderEvent,
} from 'angular-calendar';

import {
  isSameDay,
  isSameMonth
} from 'date-fns';

import getUnixTime from 'date-fns/getUnixTime';
import isWithinRange from 'date-fns/isWithinInterval';

import { Subject } from 'rxjs';

import {
  Get as GetReservations,
  Insert as InsertReservation,
  Update as UpdateReservation
} from '../../../store/actions/reservations.actions';

import { Get as GetBusiness } from '../../../store/actions/business.actions';
import { Get as GetServices } from '../../../store/actions/services.actions';

import { Reservation } from '../../../models/reservation';
import { Service } from '../../../models/service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalReservationComponent } from '../../../common/modals/reservation/reservation.component';

import {
  customDateParser,
  isValidDate,
  dateToString,
  changeState,
  itsGone,
  getDayStartEnd,
  showItemInList,
  colors
} from '../../../common/utils';
import { ToastrService } from 'ngx-toastr';

import { CustomEventTitleFormatter } from '../../../common/injectable';
import { Business } from '../../../models/business';



@Component({
  selector: 'app-admin-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css'],
  providers: [{provide: CalendarEventTitleFormatter, useClass: CustomEventTitleFormatter}],
})
export class AdminPlansComponent implements OnInit {

  refresh: Subject<any> = new Subject();
  view: CalendarView = CalendarView.Day;
  viewDate: Date = new Date();

  clickedDate: Date;
  clickedColumn: number;

  activeDayIsOpen = false;

  actions: CalendarEventAction[] = [
    {
      label: '<i class="pl-1 fa fa-pencil"></i>',
      a11yLabel: 'Edit',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      },
    },
    {
      label: '<i class="pl-1 fa fa-trash"></i>',
      a11yLabel: 'Delete',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        this.handleEvent('Deleted', event);
      },
    },
  ];

  events: CalendarEvent[] = [];

  dayStartHour = 6;
  dayEndHour = 22;

  business: Business;
  timeTable: any[] = [];
  todayIsClose = false;
  services: Service[] = [];

  weekStartsOn = 1;

  currentState$: Observable<any>;
  isLoading: boolean;
  dispose: any;

  activeTab = 2;

  counters = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  };

  constructor(
    private store: Store<AppState>,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {
    this.currentState$ = this.store.select(selectBusinessState);
  }

  ngOnInit(): void {

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
      if (state.reservations){
        this.events = state.reservations?.map((reservation: Reservation) => {
            const isPending = reservation.isApproved === false && reservation.isReject === false;
            const editable = !itsGone(reservation.start);
            return {
              start: new Date(reservation.start),
              end: new Date(reservation.end),
              title: this.joinServices(reservation.services) +
                ' Cliente: ' + reservation.customer.fullName +
                ( reservation.note ? ' Note: ' + reservation.note : ''),
              color: isPending ? colors.yellow : ( reservation.isApproved === true ? colors.green : colors.red ),
              actions: [],
              allDay: false,
              resizable: { beforeStart: editable, afterEnd: editable },
              draggable: editable,
              meta: reservation
            };
        });

        this.reloadCounters();

        if (this.activeTab === 2) { this.events = this.events.filter(event => showItemInList(this.view, this.viewDate, event.start)); }
        // Hide the events in calendar if are rejected
        else { this.events = this.events.filter(event => event.meta.isReject === false); }
        this.recalculateStoreOpenClose(this.view === 'week' ? false : true);
     }
    });
  }

  reloadCounters(): void{
    this.counters.total = this.counters.approved = this.events.filter(
      event => showItemInList(this.view, this.viewDate, event.start)
    ).length;
    this.counters.approved = this.events.filter(
      event =>
        (event.meta.isApproved === true && event.meta.isReject === false) && showItemInList(this.view, this.viewDate, event.start)
    ).length;
    this.counters.pending = this.events.filter(
      event => (event.meta.isApproved === false && event.meta.isReject === false) && showItemInList(this.view, this.viewDate, event.start)
    ).length;
    this.counters.rejected = this.events.filter(
      event => (event.meta.isApproved === false && event.meta.isReject === true) && showItemInList(this.view, this.viewDate, event.start)
    ).length;
  }

  joinServices(services: Service[]): string {
    return services.map((service: Service) => service.name).join(', ');
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate) && this.view === 'month') {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) { this.activeDayIsOpen = false; } else { this.activeDayIsOpen = true; }
      this.viewDate = date;
    }
    if (this.activeDayIsOpen === false){
      this.view = CalendarView.Day;
      this.recalculateStoreOpenClose(true);
    }
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
    modalRef.componentInstance.isAdmin = true;
    modalRef.result.then((result) => {
      if (result instanceof Reservation) { this.store.dispatch(new InsertReservation(result)); }
    }).catch((error: any) => { console.log(error); });
  }

  editReservation(reservation: Reservation): void{
    const modalRef = this.modalService.open(ModalReservationComponent, { size: 'md', centered: false });
    modalRef.componentInstance.reservation = {... reservation};
    modalRef.componentInstance.services = this.services;
    modalRef.componentInstance.business = this.business;
    modalRef.componentInstance.isAdmin = true;
    modalRef.result.then((result) => {
      if (result instanceof Reservation || typeof(result) === 'object') { this.store.dispatch(new UpdateReservation(result)); }
    }).catch((error: any) => { console.log(error); });
  }

  _changeState(state: string, event: CalendarEvent): void{
    event.meta = changeState(state, {... event.meta});
    this.store.dispatch(new UpdateReservation(event.meta));
  }

  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    if (isValidDate(newStart, this.timeTable) === true && isValidDate(newEnd, this.timeTable) === true) {
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

  deleteEvent(eventToDelete: CalendarEvent): any {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  fetchReservation(): void{
    const timestamp = getUnixTime(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1));
    this.store.dispatch(new GetReservations({timestamp}));
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
    if (isValidDate(date, this.timeTable) === true) { this.newReservation(date); }
  }

  beforeWeekViewRender(renderEvent: CalendarWeekViewBeforeRenderEvent): void {
    this.disableDayHours(renderEvent);
  }

  beforeDayViewRender(renderEvent: CalendarDayViewBeforeRenderEvent): void {
    this.disableDayHours(renderEvent);
  }

}
