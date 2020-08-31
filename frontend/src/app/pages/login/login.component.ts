import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, selectAuthState } from '../../store/app.state';
import { Login, Password } from '../../store/actions/auth.actions';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: any = { username: '', password: '' };

  currentState$: Observable<any>;
  response: any | null;
  isLoading = false;
  dispose: any;

  constructor(
    private store: Store<AppState>,
    private toastr: ToastrService
  ) {
    this.currentState$ = this.store.select(selectAuthState);
  }

  ngOnInit(): void {
    this.currentState$.subscribe((state) => {
      this.isLoading = state.isLoading;
    });
  }

  onSubmit(): void {
    this.store.dispatch(new Login({... this.form}));
  }

  password(): void{
    if (!this.form.username) { this.toastr.error('Assicurati di aver inserito l\'username', 'Ops!'); }
    else { this.store.dispatch(new Password({username: this.form.username})); }

    this.dispose = this.currentState$.subscribe((state) => {
      this.isLoading = state.isLoading;
      if (state.isLoading === false){
        if (state.response?.error !== null && this.dispose) {
          this.dispose.unsubscribe();
          if (state.response?.error === false) {
            this.toastr.success(
              state.response.message ? state.response.message : 'Aggiornamento completato con successo', 'Evviva!', { timeOut: 3000 }
            );
          }
        }
      }
    });

  }

}
