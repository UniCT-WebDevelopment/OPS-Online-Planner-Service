import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Service } from '../../../models/service';
import { Reservation } from '../../../models/reservation';

import { CustomersService } from '../../../providers/http-api/customers.service';

import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { isValidDate, dateToString, makeEqualServicesArray, changeState, itsGone } from '../../utils';
// declare var $: any;

import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  endOfWeek,
  addMinutes,
  getHours,
  set
} from 'date-fns';
import { concat, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { User } from '../../../models/user';
import { Business } from 'src/app/models/business';

@Component({
  selector: 'app-modal-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ModalReservationComponent implements OnInit{

  isNew = true;
  isEditable = true;
  @Input() isAdmin: boolean;

  reservationServices: Service[] = [];
  @Input() services: Service[];

  @Input() business: Business;
  timeTable: any[] = [];

  @Input() date?: Date;
  @Input() reservation?: Reservation;

  dateForBootstrap: NgbDateStruct;
  timeForBootstrap: any;

  totalDuration = 0;
  totalPrice = 0;

  people$: Observable<User[]>;
  customersLoading = false;
  customersInput$ = new Subject<string>();


  constructor(
    private toastr: ToastrService,
    private customersService: CustomersService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void{
    this.timeTable = JSON.parse(JSON.stringify(this.business.timeTable)) ;
    if (!this.reservation){
      this.reservation = new Reservation();
      this.reservation.services = [];

      this.dateForBootstrap = {
        year: this.date.getFullYear(),
        month: this.date.getMonth() + 1,
        day: this.date.getDate()
      };
      this.timeForBootstrap = {
        hour: this.date.getHours(),
        minute: this.date.getMinutes()
      };
      this.loadCustomers();
    }else {
      this.isNew = false;
      this.isEditable = !itsGone(this.reservation.start);
      this.dateForBootstrap = {
        year: new Date(this.reservation.start).getFullYear(),
        month: new Date(this.reservation.start).getMonth() + 1,
        day: new Date(this.reservation.start).getDate()
      };
      this.timeForBootstrap = {
        hour: new Date(this.reservation.start).getHours(),
        minute: new Date(this.reservation.start).getMinutes()
      };

      this.reservationServices = this.reservation.services.map((service: Service) => (({ ... service, id: service.serviceId })));
      this.updateTotal();
    }

    /*
    $(document).ready(() => {
      const modalContent: any = $('.modal-content');
      const modalHeader = $('.modal-header');
      modalHeader.addClass('cursor-all-scroll');
      modalContent.draggable({
          handle: '.modal-header'
      });
    });
    */
  }

  _changeState(state: string): void{ this.reservation = changeState(state, this.reservation); }

  updateTotal(): void{
    this.totalDuration = this.reservationServices.map((service: Service) => service.durationM).reduce((a, b) => a + b, 0);
    this.totalPrice = this.reservationServices.map((service: Service) => service.price).reduce((a, b) => a + b, 0);
  }

  save(): void{
    // new Date(year, month, day, hours, minutes, seconds, milliseconds)
    const date = new Date(
      this.dateForBootstrap.year,
      this.dateForBootstrap.month - 1,
      this.dateForBootstrap.day,
      this.timeForBootstrap.hour,
      this.timeForBootstrap.minute,
    );

    if (isValidDate(date, this.timeTable) === false){
      this.toastr.error('La data selezionata non e\' valida in quanto il negozio sembra essere chiuso', 'Ops!');
    }
    else{
      if (this.reservation.services.length === 0){
        this.reservation.services = this.reservationServices.map((service: Service) => ({... service, serviceId: service.id, id: null}));
      } else {
        this.reservation.services = makeEqualServicesArray(this.reservationServices, this.reservation.services, 'push');
        this.reservation.services = makeEqualServicesArray(this.reservation.services, this.reservationServices, 'slice');
      }

      this.reservation.start = dateToString(date);
      this.reservation.end = dateToString(addMinutes(
        new Date(date),
        this.reservation.services.map((service: Service) => service.durationM).reduce((a, b) => a + b, 0)
      ));

      this.activeModal.close(this.reservation);
    }
  }

  trackByFn(item: User): number {
    return item.id;
  }

  loadCustomers(): void {
    this.people$ = concat(
        of([]), // default items
        this.customersInput$.pipe(
            distinctUntilChanged(),
            tap(() => this.customersLoading = true),
            switchMap(term => this.customersService.get(this.business.id, term).pipe(
                catchError(() => of([])), // empty list on error
                tap(() => this.customersLoading = false)
            ))
        )
    );
  }

}
