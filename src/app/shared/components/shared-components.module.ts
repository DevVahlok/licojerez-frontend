import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablaTabulatorComponent } from './tabla-tabulator/tabla-tabulator.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { ComponentLoadingManagerComponent } from '../layers/component-loading-manager/component-loading-manager.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';



@NgModule({
  declarations: [
    TablaTabulatorComponent,
    ComponentLoadingManagerComponent
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
    TablaTabulatorComponent,
    ComponentLoadingManagerComponent
  ]
})
export class SharedComponentsModule { }
