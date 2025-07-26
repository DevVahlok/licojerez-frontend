import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';

@Component({
  selector: 'app-ficha-articulo',
  templateUrl: './ficha-articulo.component.html',
  styleUrls: ['./ficha-articulo.component.scss']
})
export class FichaArticuloComponent {

  public modo: 'creacion' | 'edicion';
  public _id: number;
  public articulo: any;
  public formArticulo = new FormGroup({
    codigo: new FormControl(0),
  })

  constructor(private _title: Title, private _router: Router, public _supabase: SupabaseService) { }

  ngOnInit() {
    this.detectarModoEdicion();
    this.establecerFormulario();
  }

  async detectarModoEdicion() {
    const ruta = this._router.url?.substring(this._router.url.lastIndexOf('/') + 1, this._router.url.length);

    if (ruta === 'articulo') {
      this.modo = 'creacion';
      this._title.setTitle('Creación de Artículo');
    } else {
      this.id = Number(ruta);
      this.modo = 'edicion';
      this._title.setTitle('Edición de Artículo');
    }
  }

  @Input() set id(value: number) {
    this._id = value;
    this.onIdCambiada(value);
  }

  get id(): number {
    return this._id;
  }

  protected onIdCambiada(valor: number): void { }

  establecerFormulario() {
    this.formArticulo.get('codigo')?.disable();
  }
}