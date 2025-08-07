import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule } from './components/shared-components.module';
import { DialogsModule } from './dialogs/dialogs-module.module';
import { MaterialModule } from '../modules/material.module';
import { FormControlPipe } from './pipes/form-control.pipe';



@NgModule({
  declarations: [
    FormControlPipe
  ],
  imports: [
    CommonModule,
    SharedComponentsModule,
    DialogsModule,
    MaterialModule
  ],
  exports: [
    FormControlPipe
  ]
})
export class SharedModule { }
