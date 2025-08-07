import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { Articulo, Familia, Marca, Proveedor, Subfamilia } from 'src/app/models/oficina';

export interface ElementoDesplegable {
  codigo: string,
  nombre: string
}

export interface ListaDesplegablesFichaArticulo {
  proveedor: ElementoDesplegable[] | null,
  familia: ElementoDesplegable[] | null,
  subfamilia: ElementoDesplegable[] | null,
  iva: ElementoDesplegable[] | null,
  marca: ElementoDesplegable[] | null,
}

@Component({
  selector: 'app-ficha-articulo',
  templateUrl: './ficha-articulo.component.html',
  styleUrls: ['./ficha-articulo.component.scss']
})
export class FichaArticuloComponent {

  public modo: 'creacion' | 'edicion';
  public _id: number;
  public articulo: Articulo;
  public formArticulo = new FormGroup({
    codigo: new FormControl(-1, Validators.required),
    fecha_alta: new FormControl('', Validators.required),
    nombre: new FormControl('', Validators.required),
    ean13_1: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_2: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_3: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_4: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_5: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    stock: new FormControl(0, [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]),
    precio_coste: new FormControl(0, Validators.required),
    tipo: new FormControl('Material', Validators.required),
    precio_venta: new FormControl(0, Validators.required),
    idProveedor: new FormControl(-1),
    idFamilia: new FormControl(-1),
    idSubfamilia: new FormControl(-1),
    idIva: new FormControl(-1, Validators.required),
    margen: new FormControl(0, Validators.required),
    activo: new FormControl(false, Validators.required),
    comision_default: new FormControl(0),
    tiene_lote: new FormControl(false, Validators.required),
    idMarca: new FormControl(-1),
    formato: new FormControl(null)
  });
  public _listasDesplegables: ListaDesplegablesFichaArticulo = {
    proveedor: null,
    familia: null,
    subfamilia: null,
    iva: null,
    marca: null,
  }

  constructor(private _title: Title, public _router: Router, public _supabase: SupabaseService, protected _snackbar: MatSnackBar) { }

  ngOnInit() {
    this.detectarModoEdicion();
    this.getListasDesplegables();
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

  async getListasDesplegables() {

    from(this._supabase.supabase.from<any, Proveedor[]>('proveedores').select('*')).subscribe(async ({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, proveedor: data?.map(prov => { return { codigo: prov.codigo, nombre: prov.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Familia[]>('familias').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, familia: data?.map(fam => { return { codigo: fam.codigo, nombre: fam.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Subfamilia[]>('subfamilias').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, subfamilia: data?.map(subfam => { return { codigo: subfam.codigo, nombre: subfam.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Marca[]>('marcas').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, marca: data?.map(marca => { return { codigo: marca.codigo, nombre: marca.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });
  }

  @Input() set id(value: number) {
    this._id = value;
    this.onIdCambiada(value);
  }

  get id(): number { return this._id; }

  protected onIdCambiada(valor: number): void { }

  @Input() set listasDesplegables(value: ListaDesplegablesFichaArticulo) {
    this._listasDesplegables = value;
    this.onListasDesplegablesCambiada(value);
  }

  get listasDesplegables(): ListaDesplegablesFichaArticulo { return this._listasDesplegables; }

  protected onListasDesplegablesCambiada(valor: ListaDesplegablesFichaArticulo): void { }
}