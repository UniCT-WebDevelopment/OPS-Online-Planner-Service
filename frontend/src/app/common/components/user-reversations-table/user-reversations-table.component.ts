import { Component, Input } from '@angular/core';
import { Reservation } from '../../../models/reservation';
import { Service } from '../../../models/service';

import differenceInMinutes from 'date-fns/differenceInMinutes';

@Component({
  selector: 'app-user-reversations-table',
  templateUrl: './user-reversations-table.component.html',
  styleUrls: ['./user-reversations-table.component.css']
})
export class UserReservationsTableComponent{

  @Input() reservations: Reservation[];

  constructor() { }

  joinServices(services: Service[]): string {
    return services.map((service: Service) => service.name).join(', ');
  }

  _differenceInMinutes(start: string, end: string): number{
    return differenceInMinutes(new Date(end), new Date(start));
  }

}
