import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { IVA } from 'src/app/models/oficina';

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
  ean13: string[],
  stock: number,
  precio_venta: string,
  precio_sin_iva: string
}

@Component({
  selector: 'app-articulos',
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.scss']
})
export class ArticulosComponent {

  public idArticulo: number;
  public indexTabs = 0;
  public buscadorArticulo = new FormControl('');
  public opcionesBuscadorArticulos: opcionBuscadorArticulo[] = [];
  public opcionesBuscadorArticulosFiltrado: opcionBuscadorArticulo[] = [];
  private timer: NodeJS.Timeout;
  public hasActiveOption = false;
  public mostrarInactivos = false;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Listado de Artículos');
    this.activarListenerInputBuscador();
  }

  abrirFicha(id: number) {
    this.buscadorArticulo.setValue('');
    this.indexTabs = 0;
    this.idArticulo = id;
  }

  seleccionarPrimero() {
    const opciones = this.opcionesBuscadorArticulosFiltrado;
    if (opciones.length > 0) this.abrirFicha(opciones[0].id_articulo)
  }

  onOptionActivated(event: any) {
    this.hasActiveOption = !!event.option;
  }

  onEnter(event: any) {
    if (this.hasActiveOption) return;
    event.preventDefault();
    this.seleccionarPrimero();
  }

  async activarListenerInputBuscador() {

    const { data, error } = await this._supabase.supabase.from<any, IVA[]>('ivas').select('*');

    const listaIvas = data?.map(iva => { return { id_iva: iva.id_iva, valor_iva: iva.valor_iva } })

    this.buscadorArticulo.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {

        if (value === '') {
          this.opcionesBuscadorArticulosFiltrado = [];
        } else {

          let query = this._supabase.supabase.from('articulos_busqueda').select('*').or(`nombre.ilike.%${value}%, id_articulo.ilike.%${value}%, ean13_1.ilike.%${value}%, ean13_2.ilike.%${value}%, ean13_3.ilike.%${value}%, ean13_4.ilike.%${value}%, ean13_5.ilike.%${value}%`).order('nombre');

          if (!this.mostrarInactivos) {
            query.eq('activo', true);
          }

          const { data } = await query;

          let resultado = data!?.map(articulo => {
            return {
              id_articulo: articulo.id_articulo,
              nombre: articulo.nombre,
              ean13: [articulo.ean13_1, articulo.ean13_2, articulo.ean13_3, articulo.ean13_4, articulo.ean13_5],
              stock: articulo.stock,
              precio_venta: (Math.trunc(articulo.precio_venta * 100) / 100).toFixed(4),
              precio_sin_iva: (Math.trunc((articulo.precio_venta / (1 + listaIvas!.find(iva => iva.id_iva === articulo.id_iva)?.valor_iva / 100) * 100)) / 100).toFixed(4)
            }
          });

          const indexCodigoIdentico = resultado.findIndex(articulo => articulo.id_articulo === value);

          if (!(indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length)) {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorArticulosFiltrado = resultado;
        }

      }, 200);

    });
  }

  cambiarTab(index: number) {
    this.indexTabs = index;

    switch (index) {
      case 1:
        this._title.setTitle('Licojerez - Listado de Artículos')
        break;
    }
  }
}