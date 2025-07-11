import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './core/components/oficina/main/main.component';
import { LoginComponent } from './core/components/login/login.component';
import { PrincipalComponent } from './core/components/principal/principal.component';
import { ListaArticulosComponent } from './core/components/oficina/lista-articulos/lista-articulos.component';
import { AuthGuard } from './core/services/guard/auth.guard';

const routes: Routes = [
  {
    path: 'oficina', canActivate: [AuthGuard], component: MainComponent,
    children: [
      {
        path: 'articulos',
        canActivate: [AuthGuard],
        component: ListaArticulosComponent
      },
    ]
  },
  { path: 'principal', canActivate: [AuthGuard], component: PrincipalComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
