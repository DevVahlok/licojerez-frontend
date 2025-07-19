import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from 'src/app/modules/material.module';
import { ListaArticulosComponent } from './lista-articulos/lista-articulos.component';
import { ListaLogsComponent } from './lista-logs/lista-logs.component';
import { MainComponent } from './main/main.component';
import { SharedComponentsModule } from 'src/app/shared/components/shared-components.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { ListaProveedoresComponent } from './lista-proveedores/lista-proveedores.component';



@NgModule({
  declarations: [
    ListaArticulosComponent,
    ListaLogsComponent,
    MainComponent,
    ListaProveedoresComponent
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
