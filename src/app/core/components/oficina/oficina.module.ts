import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from 'src/app/modules/material.module';
import { ListaArticulosComponent } from './articulos/lista-articulos/lista-articulos.component';
import { ListaLogsComponent } from './lista-logs/lista-logs.component';
import { MainComponent } from './main/main.component';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { ListaProveedoresComponent } from './lista-proveedores/lista-proveedores.component';
import { ConfiguracionArticulosComponent } from './configuracion-articulos/configuracion-articulos.component';
import { FichaArticuloComponent } from './articulos/ficha-articulo/ficha-articulo.component';
import { ArticulosComponent } from './articulos/articulos.component';



@NgModule({
  declarations: [
    ListaArticulosComponent,
    ListaLogsComponent,
    MainComponent,
    ListaProveedoresComponent,
    ConfiguracionArticulosComponent,
    ArticulosComponent,
    FichaArticuloComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SharedComponentsModule,
    RouterModule
  ],
  exports: [
    ListaArticulosComponent,
    ListaLogsComponent,
    MainComponent
  ]
})
export class OficinaModule { }