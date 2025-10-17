import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { IVA } from 'src/app/models/oficina';
import { BuscadorComponent } from 'src/app/shared/components/buscador/buscador.component';

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
  public listaResultadosBuscador: opcionBuscadorArticulo[] | null = null;
  public listaColumnasBuscador: { title: string, field: string, unidad?: string }[] = [{ title: 'Código', field: 'id_articulo' }, { title: 'Nombre', field: 'nombre' }, { title: 'Stock', field: 'stock' }, { title: 'Precio venta', field: 'precio_sin_iva', unidad: '€' }, { title: 'Precio + IVA', field: 'precio_venta', unidad: '€' }]
  @ViewChild('buscador') buscador: BuscadorComponent;
  public listaIvas: { id_iva: number, valor_iva: number }[];

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Listado de Artículos');
    this.inicializarBuscador();
  }

  abrirFicha(id: number) {
    this.indexTabs = 0;
    this.idArticulo = id;
  }

  async inicializarBuscador() {
    const { data, error } = await this._supabase.supabase.from<any, IVA[]>('ivas').select('*');
    this.listaIvas = data?.map(iva => { return { id_iva: iva.id_iva, valor_iva: iva.valor_iva } })!
  }

  async cargarBuscador(value: string) {

    this.buscador.spinner = true;

    let query = this._supabase.supabase.from('articulos_busqueda').select('*').or(`nombre.ilike.%${value}%, id_articulo.ilike.%${value}%, ean13_1.ilike.%${value}%, ean13_2.ilike.%${value}%, ean13_3.ilike.%${value}%, ean13_4.ilike.%${value}%, ean13_5.ilike.%${value}%`).order('nombre');

    if (!this.buscador.mostrarInactivos) {
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
        precio_sin_iva: (Math.trunc((articulo.precio_venta / (1 + this.listaIvas!.find(iva => iva.id_iva === articulo.id_iva)?.valor_iva! / 100) * 100)) / 100).toFixed(4)
      }
    });

    const indexCodigoIdentico = resultado.findIndex(articulo => articulo.id_articulo === value);

    if (!(indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length)) {
      const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
      resultado.unshift(elemento);
    }

    this.listaResultadosBuscador = resultado;

    this.buscador.spinner = false;
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