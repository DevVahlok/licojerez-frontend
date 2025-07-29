import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { Articulo } from 'src/app/models/oficina';

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
    codigo: new FormControl(0, Validators.required),
    fecha_alta: new FormControl(null, Validators.required),
    nombre: new FormControl(null, Validators.required),
    ean13_1: new FormControl(null),
    ean13_2: new FormControl(null),
    ean13_3: new FormControl(null),
    ean13_4: new FormControl(null),
    ean13_5: new FormControl(null),
    stock: new FormControl(null, Validators.required),
    precio_coste: new FormControl(null, Validators.required),
    tipo: new FormControl(null, Validators.required),
    precio_venta: new FormControl(null, Validators.required),
    idProveedor: new FormControl(null),
    idFamilia: new FormControl(null),
    idSubfamilia: new FormControl(null),
    idIva: new FormControl(null, Validators.required),
    margen: new FormControl(null, Validators.required),
    activo: new FormControl(null, Validators.required),
    comision_default: new FormControl(null),
    tiene_lote: new FormControl(null, Validators.required),
    idMarca: new FormControl(null)
  });
  public listasDesplegables: { proveedor: { codigo: string, nombre: string }[] | null, familia: { codigo: string, nombre: string }[] | null, subfamilia: { codigo: string, nombre: string }[] | null, iva: { codigo: string, nombre: string }[] | null, marca: { codigo: string, nombre: string }[] | null, } = {
    proveedor: null,
    familia: null,
    subfamilia: null,
    iva: null,
    marca: null,
  }

  constructor(private _title: Title, private _router: Router, public _supabase: SupabaseService) { }

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

  getListasDesplegables() {

    //TODO: por qué esta deprecated?
    from(this._supabase.supabase.from('proveedores').select('*')).subscribe(res => {  //TODO: tipar res
      //TODO: no aparece en el componente hijo, tal vez que hay que hacer un set/get?
      this.listasDesplegables.proveedor = res.data?.map(prov => { return { codigo: prov.codigo as string, nombre: prov.nombre as string } })!; //TODO: prov es any
    }, (err) => {

    })

  }

  @Input() set id(value: number) {
    this._id = value;
    this.onIdCambiada(value);
  }

  get id(): number {
    return this._id;
  }

  protected onIdCambiada(valor: number): void { }
}