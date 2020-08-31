import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as Constant from '../../common/constants';
import { Reservation } from '../../models/reservation';

@Injectable()
export class ReservationsService {

  constructor(private http: HttpClient) {}

  get(businessId: number, timestamp: number, customerId: number): Observable<any> {
    let url = `${Constant.API_ENDPOINT}/reservations?business_id=${businessId}`;
    if (timestamp) { url += `&timestamp=${timestamp}`; }
    if (typeof(customerId) === 'number') { url += `&customer_id=${customerId}`; }
    return this.http.get(url);
  }

  update(businessId: number, payload: Reservation[]): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/reservations`;
    return this.http.put<Reservation>(url, {business_id: businessId, reservations: payload});
  }

  insert(payload: Reservation): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/reservations`;
    return this.http.post<Reservation>(url, payload);
  }

  delete(id: number, businessId: number): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/reservations?id=${id}&business_id=${businessId}`;
    return this.http.delete<Reservation>(url);
  }
}
