import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OficinaModule } from './oficina/oficina.module';
import { LoginComponent } from './login/login.component';
import { PrincipalComponent } from './principal/principal.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';



@NgModule({
  declarations: [
    LoginComponent,
    PrincipalComponent
  ],
  imports: [
    CommonModule,
    OficinaModule,
    MaterialModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ClipboardModule,
  ],
  exports: [
    LoginComponent,
    PrincipalComponent
  ]
})
export class CoreComponentsModule { }
