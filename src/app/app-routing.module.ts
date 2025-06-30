import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './core/main/main.component';
import { LoginComponent } from './core/login/login.component';
import { PrincipalComponent } from './core/principal/principal.component';

const routes: Routes = [
  {
    path: '', component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'principal',
        pathMatch: 'full'
      }
    ]
  },
  { path: 'principal', component: PrincipalComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
