
import {
    isSameDay,
    isSameMonth,
    isSameWeek,
    set
} from 'date-fns';

import isWithinRange from 'date-fns/isWithinInterval';
import isBefore from 'date-fns/isBefore';

import { Reservation } from '../models/reservation';
import { Service } from '../models/service';

export const colors: any = {
    blue: {
      primary: '#1e90ff',
      secondary: '#d1e8ff',
    },
    green: {
      primary: '#21ad28',
      secondary: '#e3fae5',
    },
    yellow: {
      primary: '#e3bc08',
      secondary: '#FDF1BA',
    },
    red: {
      primary: '#ad2121',
      secondary: '#fae3e3',
    }
};

export function customDateParser(date: any, time: string): any {
    const hours = parseInt(time.split(':')[0], 0);
    const minutes = parseInt(time.split(':')[1], 0);

    return set(date, { hours, minutes });
}

export function isValidDate(date: Date, timeTable: any[]): boolean{
    let isValid = false;
    const day = timeTable[date.getDay() !== 0 ? date.getDay() - 1 : 6];
    ['morning', 'afternoon'].some((type: string) => {
        if (day[type].open !== null && day[type].close !== null){
            const open = customDateParser(date, day[type].open);
            const close = customDateParser(date, day[type].close);
            if (isWithinRange( date, { start: open, end: close } )) {
                isValid = true;
                return true;
            }
        }
    });
    return isValid;
}

// 2020-07-31 23:31:55
export function dateToString(date: Date): string{
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getMilliseconds().toString().padStart(2, '0')}`;
}

// mhh it's something like, push if not exist in array, remove if exist ...
export function makeEqualServicesArray(a: Service[], b: Service[], op: string = 'slice'): Service[] {
    for (let i = 0; i < a.length; i++){
        let founded = false;
        // tslint:disable-next-line: prefer-for-of
        for (let j = 0; j < b.length; j++){
            if (a[i].serviceId === b[j].serviceId && a[i].name === b[j].name){
                founded = true;
                break;
            }
        }
        if (founded === false && op === 'slice' && a[i].id) { a = a.filter((value, index) => index !== i ); }
        else if (founded === false && op === 'push') { b = [... b, { ... a[i], serviceId: a[i].id, id: null}]; }
    }
    return op === 'slice' ? a : b;
}

export function changeState(state: string, reservation: Reservation): Reservation{
    switch (state) {
      case 'approved':
        reservation.isApproved = true;
        reservation.isReject = false;
        break;
      case 'reject':
        reservation.isApproved = false;
        reservation.isReject = true;
        break;
      default:
        reservation.isApproved = false;
        reservation.isReject = false;
        break;
    }
    return reservation;
}

export function itsGone(date: any): boolean{
    return isBefore(new Date(), typeof(date) === 'string' ? new Date(date) : date) ? false : true;
}

export function getDayStartEnd(timeTable: any[], viewDate: Date, single = true): any {
    const allhours = [];
    const timings = single ? [timeTable[viewDate.getDay() !== 0 ? viewDate.getDay() - 1 : 6]] : timeTable;
    timings.forEach((value: any) => {
      ['morning', 'afternoon'].map((type: string) => {
        if (value[type].open !== null && value[type].close !== null){
          allhours.push(parseInt(value[type].open.split(':')[0], 0));
          allhours.push(parseInt(value[type].close.split(':')[0], 0));
        }
      });
    });
    const max = Math.max(...allhours);
    const min = Math.min(...allhours);
    return { min, max };
}

export function showItemInList(view: any, viewDate: Date, start: any): boolean{
    if (view === 'month' && isSameMonth(typeof(start) === 'string' ? new Date(start) : start, viewDate ) ) { return true; }
    if (view === 'week' && isSameWeek(typeof(start) === 'string' ? new Date(start) : start, viewDate )) { return true; }
    if (view === 'day' && isSameDay(typeof(start) === 'string' ? new Date(start) : start, viewDate ) ) { return true; }
    return false;
}