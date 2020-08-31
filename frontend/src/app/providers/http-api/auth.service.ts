import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from '../../models/user';

import * as Constant from '../../common/constants';

@Injectable()
export class AuthService {

  constructor(private http: HttpClient) {}

  getToken(): string {
    return localStorage.getItem('token');
  }

  login(payload: any): Observable<any> {
    const url = `${Constant.API_ENDPOINT}/user/login`;
    return this.http.post<User>(url, payload);
  }

  register(payload: any): Observable<User> {
    const url = `${Constant.API_ENDPOINT}/user/register`;
    return this.http.post<User>(url, payload);
  }

  status(): Observable<User> {
    const url = `${Constant.API_ENDPOINT}/user`;
    return this.http.get<User>(url);
  }

  update(payload: any): Observable<User> {
    const url = `${Constant.API_ENDPOINT}/user`;
    return this.http.put<User>(url, payload);
  }

  password(payload: any): Observable<User> {
    const url = `${Constant.API_ENDPOINT}/user/password`;
    return this.http.post<User>(url, payload);
  }

  logout(): Observable<User> {
    const url = `${Constant.API_ENDPOINT}/user`;
    return this.http.delete<User>(url);
  }

}
