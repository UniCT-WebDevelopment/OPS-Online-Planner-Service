import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CalendarView } from 'angular-calendar';

@Component({
  selector: 'app-calendar-header',
  templateUrl: './calendar-header.component.html',
  styleUrls: ['./calendar-header.component.css']
})
export class CalendarHeaderComponent{

  @Input() view: CalendarView;
  @Input() viewDate: Date;
  @Input() locale = 'it-ITA';

  @Output() viewChange = new EventEmitter<CalendarView>();
  @Output() viewDateChange = new EventEmitter<Date>();

  CalendarView = CalendarView;

  capitalize(stringDate): string{
    return stringDate[0].toUpperCase() + stringDate.slice(1).toLowerCase();
  }

}
