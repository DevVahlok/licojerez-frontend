import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogConfigTabla } from './dialog-config-tabla/dialog-config-tabla';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/modules/material.module';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DialogConfirmacion } from './dialog-confirmacion/dialog-confirmacion';



@NgModule({
  declarations: [
    DialogConfigTabla,
    DialogConfirmacion
  ],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ClipboardModule,
  ],
  exports: [
    DialogConfigTabla,
    DialogConfirmacion
  ]
})
export class DialogsModule { }
