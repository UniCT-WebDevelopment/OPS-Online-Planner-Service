import { Injectable } from '@angular/core';
import { CalendarEventTitleFormatter, CalendarEvent } from 'angular-calendar';
import { NgbTimeAdapter, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { Service } from '../models/service';

@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
    // The Tooltip are equal, except for <br> in week and day
    monthTooltip(event: CalendarEvent): string {
        return !event.title ? '' : event.meta.services.map((service: Service) => service.name).join(', ') +
        ' <b>Cliente:</b>: ' + event.meta.customer.fullName +
        ( event.meta.note ? ' <b>Note:</b>: ' + event.meta.note : '');
    }

    weekTooltip(event: CalendarEvent): string {
        return !event.title ? '' : event.meta.services.map((service: Service) => service.name).join(', ') +
        ' <br><b>Cliente:</b> ' + event.meta.customer.fullName +
        ( event.meta.note ? ' <br><b>Note:</b> ' + event.meta.note : '');
    }

    dayTooltip(event: CalendarEvent): string {
        return !event.title ? '' : event.meta.services.map((service: Service) => service.name).join(', ') +
        ' <br><b>Cliente:</b> ' + event.meta.customer.fullName +
        ( event.meta.note ? ' <br><b>Note:</b> ' + event.meta.note : '');
    }
}

const pad = (i: number): string => i < 10 ? `0${i}` : `${i}`;
@Injectable()
export class NgbTimeStringAdapter extends NgbTimeAdapter<string> {
    fromModel(value: string| null): NgbTimeStruct | null {
        if (!value) { return null; }
        const split = value.split(':');
        return {
            hour: parseInt(split[0], 10),
            minute: parseInt(split[1], 10),
            second: parseInt(split[2], 10)
        };
    }

    toModel(time: NgbTimeStruct | null): string | null {
        return time != null ? `${pad(time.hour)}:${pad(time.minute)}` : null;
    }
}
