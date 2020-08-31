import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, selectAuthState } from '../../store/app.state';
import { Register } from '../../store/actions/auth.actions';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  form: any = {
    fullname: '',
    email: '',
    username: '',
    password1: '',
    password2: ''
  };

  currentState$: Observable<any>;
  response: any | null;
  isLoading = false;

  constructor(
    private store: Store<AppState>
  ) {
    this.currentState$ = this.store.select(selectAuthState);
  }

  ngOnInit(): void {
    this.currentState$.subscribe((state) => {
      this.response = state.response;
      this.isLoading = state.isLoading;
    });
  }

  onSubmit(): void {
    if (this.form.password1 !== this.form.password2) {
      this.response.error = true;
      this.response.message = 'Le due password inserite non coincidono';
    }
    else {
      this.response = null;
      this.store.dispatch(new Register({... this.form}));
    }
  }

}
