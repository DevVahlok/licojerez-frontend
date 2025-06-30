import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import packageJson from '../../../../package.json';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public datosProyecto = {
    fe_angular: packageJson.version,
    be_rest: 'desconocido',
    entorno: environment.entorno
  }
  public formLogin = new FormGroup({
    user: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  public ocultarPassword: boolean = true;

  constructor() { }

  ngOnInit() {

  }

  login() {

  }

  limpiarErroresInputs() {

  }
}
