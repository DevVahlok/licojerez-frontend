import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './core/components/oficina/main/main.component';
import { LoginComponent } from './core/components/login/login.component';
import { PrincipalComponent } from './core/components/principal/principal.component';
import { AuthGuard } from './core/services/guard/auth.guard';
import { ListaLogsComponent } from './core/components/oficina/lista-logs/lista-logs.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { ArticulosComponent } from './core/components/oficina/articulos/articulos.component';
import { ProveedoresComponent } from './core/components/oficina/proveedores/proveedores.component';

const routes: Routes = [
  {
    path: 'oficina', canActivate: [AuthGuard], component: MainComponent,
    children: [
      {
        path: 'articulos',
        canActivate: [AuthGuard],
        component: ArticulosComponent
      },
      {
        path: 'proveedores',
        canActivate: [AuthGuard],
        component: ProveedoresComponent
      },
      {
        path: 'logs',
        canActivate: [AuthGuard],
        component: ListaLogsComponent
      },
    ]
  },
  { path: 'principal', canActivate: [AuthGuard], component: PrincipalComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }] //TODO: eliminar cuando se quite el host de github pages
})
export class AppRoutingModule { }
