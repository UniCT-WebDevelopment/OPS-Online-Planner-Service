import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

import { AuthGuardService as AuthGuard, AuthAdminGuardService as AuthAdminGuard } from './providers/auth-guard.service';
import { AdminBusinessComponent } from './pages/admin/admin-business/business.component';
import { AdminPlansComponent } from './pages/admin/admin-plans/plans.component';
import { AdminServicesComponent } from './pages/admin/admin-services/services.component';
import { AdminCustomersComponent } from './pages/admin/admin-customers/customers.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin',  redirectTo: '/admin/plans', pathMatch: 'full' },
  { path: 'admin/business', component: AdminBusinessComponent, canActivate: [AuthAdminGuard] },
  { path: 'admin/plans', component: AdminPlansComponent, canActivate: [AuthAdminGuard] },
  { path: 'admin/services', component: AdminServicesComponent, canActivate: [AuthAdminGuard] },
  { path: 'admin/customers', component: AdminCustomersComponent, canActivate: [AuthAdminGuard] },
  { path: '',   redirectTo: '/home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
