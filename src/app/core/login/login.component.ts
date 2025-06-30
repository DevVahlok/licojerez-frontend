import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import packageJson from '../../../../package.json';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

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

  constructor(private _title: Title, private _router: Router) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Login');
  }

  login() {

    const datos = this.formLogin.getRawValue();

    //TODO: aplicar con usuarios en bbdd

    if (datos.user !== '' && datos.password !== '') {
      if (datos.user === 'admin' && datos.password === 'admin') {
        this._router.navigate(['/principal'])
      } else {
        this.formLogin.get('password')?.setErrors({ incorrect: true })
        this.formLogin.get('password')?.markAsTouched();
      }
    }
  }

  limpiarErroresInputs() {
    this.formLogin.get('user')?.setErrors(null)
    this.formLogin.get('password')?.setErrors(null)
  }
}
