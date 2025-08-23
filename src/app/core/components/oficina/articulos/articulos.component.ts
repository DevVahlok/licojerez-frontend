import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';

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

interface opcionBuscadorArticulo {
  id_articulo: number,
  nombre: string,
  ean13: string[]
}

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.scss']
})
export class ArticulosComponent {

  public idArticulo: number;
  public indexTabs = 1;
  public buscadorArticulo = new FormControl('');
  public opcionesBuscadorArticulos: opcionBuscadorArticulo[] = [];
  public opcionesBuscadorArticulosFiltrado: opcionBuscadorArticulo[] = [];
  private timer: NodeJS.Timeout;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Artículos');
    this.activarListenerInputBuscador();
  }

  abrirFicha(id: number) {
    this.buscadorArticulo.setValue('');
    this.indexTabs = 0;
    this.idArticulo = id;
    this._title.setTitle('Edición de Artículo');
  }

  seleccionarPrimero() {
    const opciones = this.opcionesBuscadorArticulosFiltrado;
    if (opciones.length > 0) this.abrirFicha(opciones[0].id_articulo)
  }

  activarListenerInputBuscador() {
    this.buscadorArticulo.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {

        if (value === '') {
          this.opcionesBuscadorArticulosFiltrado = [];
        } else {
          const { data } = await this._supabase.supabase.from('articulos_busqueda').select('*').or(`nombre.ilike.%${value}%, id_articulo.ilike.%${value}%, ean13_1.ilike.%${value}%, ean13_2.ilike.%${value}%, ean13_3.ilike.%${value}%, ean13_4.ilike.%${value}%, ean13_5.ilike.%${value}%`);

          let resultado = data!?.map(articulo => { return { id_articulo: articulo.id_articulo, nombre: articulo.nombre, ean13: [articulo.ean13_1, articulo.ean13_2, articulo.ean13_3, articulo.ean13_4, articulo.ean13_5] } });

          const indexCodigoIdentico = resultado.findIndex(articulo => articulo.id_articulo === value);

          if (indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length) {

          } else {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorArticulosFiltrado = resultado;
        }

      }, 200);

    });
  }
}