import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState, selectAuthState } from '../../../store/app.state';
import { Logout, Update as UpdateUser } from '../../../store/actions/auth.actions';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalUpdateComponent } from '../../../common/modals/update/update.component';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit{

  authState$: Observable<any>;

  constructor(
    public router: Router,
    private store: Store<AppState>,
    private modalService: NgbModal
  ) { this.authState$ = this.store.select(selectAuthState); }

  ngOnInit(): void {}

  logout(): void { this.store.dispatch(new Logout()); }

  updateUser(action: string): void{
    const modalRef = this.modalService.open(ModalUpdateComponent, { size: 'md', centered: false });
    modalRef.componentInstance.action = action;
    modalRef.result.then((result) => {
      if (typeof(result) === 'object') { this.store.dispatch(new UpdateUser({... result, action})); }
    }).catch((error: any) => { console.log(error); });
  }

}
