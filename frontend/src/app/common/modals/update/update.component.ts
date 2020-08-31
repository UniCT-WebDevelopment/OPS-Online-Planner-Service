import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-modal-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css']
})
export class ModalUpdateComponent implements OnInit{

  @Input() action: string;
  form: any = {};

  constructor(
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void{
    if (this.action === 'email'){ this.form = { email: '' };
    }else { this.form = { password: '', password1: '', password2: '' }; }
  }

  updateUser(): void {
    if (this.action === 'password'){
      if (!this.form.password) { this.toastr.error('Inserisci la tua password attuale', 'Ops!'); }
      else if (!this.form.password1) { this.toastr.error('Inserisci la tua nuova password', 'Ops!'); }
      else if (!this.form.password2) { this.toastr.error('Inserisci la verifica password', 'Ops!'); }
      else if (this.form.password !== this.form.password2) { this.toastr.error('Le password inserite non coicidono', 'Ops!'); }
      else { this.activeModal.close(this.form); }
    }
    else {
      if (!this.form.email) { this.toastr.error('Inserisci la tua nuova email', 'Ops!'); }
      else { this.activeModal.close(this.form); }
    }
  }

}
