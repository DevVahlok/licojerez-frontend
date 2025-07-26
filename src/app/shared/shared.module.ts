import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule } from './components/shared-components.module';
import { DialogsModule } from './dialogs/dialogs-module.module';
import { MaterialModule } from '../modules/material.module';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedComponentsModule,
    DialogsModule,
    MaterialModule
  ]
})
export class SharedModule { }
