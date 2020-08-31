import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as Constant from '../../common/constants';
import { Service } from '../../models/service';

@Injectable()
export class ServicesService {

  constructor(private http: HttpClient) {}

  get(businessId: number): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/services?business_id=${businessId}`;
    return this.http.get(url);
  }

  update(payload: Service): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/services`;
    return this.http.put<Service>(url, payload);
  }

  insert(payload: Service): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/services`;
    return this.http.post<Service>(url, payload);
  }

  delete(id: number, businessId: number): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/services?id=${id}&business_id=${businessId}`;
    return this.http.delete<Service>(url);
  }
}
