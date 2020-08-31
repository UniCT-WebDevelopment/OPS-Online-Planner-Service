import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import * as Constant from '../../common/constants';
import { Business } from '../../models/business';

@Injectable()
export class BusinessService {

  constructor(private http: HttpClient) {}

  get(): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/business`;
    return this.http.get(url);
  }

  update(payload: Business): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/business`;
    return this.http.post<Business>(url, payload);
  }
}
