import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from './http-api/auth.service';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private authService: AuthService;
  constructor(private injector: Injector) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // console.log(request.url); // register // login Please skip this in the next :/
    this.authService = this.injector.get(AuthService);
    const token: string = this.authService.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (request.method !== 'GET') { headers['Content-Type'] = 'application/json'; }
    request = request.clone({ setHeaders: headers });
    return next.handle(request);
  }
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private toastr: ToastrService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((response: HttpErrorResponse) => {
          if (response instanceof HttpErrorResponse){
            if (response.status === 403 || response.status === 422) {
              localStorage.removeItem('token');
              this.router.navigateByUrl('/login');
            }
            else if (response.status === 400 || response.status === 500) {
              const message = (response.error && response.error.message) ? response.error.message : 'Si e\' verificato un errore generico';
              this.toastr.error(message, 'Ops!');
            }
          }
          return throwError(response);
        })
      );
  }
}
