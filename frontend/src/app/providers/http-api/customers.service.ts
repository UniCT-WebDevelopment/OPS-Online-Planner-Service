import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as Constant from '../../common/constants';
import { User } from '../../models/user';

@Injectable()
export class CustomersService {

  constructor(private http: HttpClient) {}

  get(businessId: number, query: string): Observable<any> {
    let url = `${Constant.API_ENDPOINT}/customers?business_id=${businessId}`;
    if (query) { url += `&q=${query}`; }
    return this.http.get(url);
  }

  update(payload: any): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/customers`;
    return this.http.put<User>(url, payload);
  }

  insert(payload: User): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/customers`;
    return this.http.post<User>(url, payload);
  }

  delete(id: number, businessId: number): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/customers?id=${id}&business_id=${businessId}`;
    return this.http.delete<User>(url);
  }
}
