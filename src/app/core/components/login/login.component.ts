import { Component, ViewEncapsulation } from '@angular/core';
import { environment } from 'src/environments/environment';
import packageJson from '../../../../../package.json';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  public datosProyecto = {
    fe_angular: packageJson.version,
    entorno: environment.entorno
  }
  public formLogin = new FormGroup({
    user: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  public ocultarPassword: boolean = true;

  constructor(private _title: Title, private _router: Router, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Login');
    this.comprobarLoginAnterior();
  }

  async comprobarLoginAnterior() {
    const { data, error } = await this._supabase.getSession();

    if (data?.session) {
      await this._supabase.setUser(data.session?.user!);
      this._router.navigate(['/oficina/articulos']);
    }
  }

  async login() {
    const datos = this.formLogin.getRawValue();

    if (datos.user !== '' && datos.password !== '') {

      const { data, error } = await this._supabase.signIn(datos.user!, datos.password!);

      if (error) {
        this.formLogin.get('password')?.setErrors({ incorrect: true })
        this.formLogin.get('password')?.markAsTouched();
      } else {
        await this._supabase.setUser(data.user);
        this._router.navigate(['/principal']);
      }
    }
  }

  limpiarErroresInputs() {
    this.formLogin.get('user')?.setErrors(null)
    this.formLogin.get('password')?.setErrors(null)
  }
}
