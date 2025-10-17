import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { BuscadorComponent } from 'src/app/shared/components/buscador/buscador.component';

export interface ElementoDesplegable {
  codigo: string,
  nombre: string
}

interface opcionBuscadorProveedor {
  id_proveedor: number,
  nombre: string,
  cif: string,
  direccion: string
}

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})
export class ProveedoresComponent {

  public idProveedor: number;
  public indexTabs = 0;
  public listaResultadosBuscador: opcionBuscadorProveedor[] | null = null;
  public listaColumnasBuscador: { title: string, field: string, unidad?: string }[] = [{ title: 'Código', field: 'id_proveedor' }, { title: 'Nombre', field: 'nombre' }, { title: 'Dirección', field: 'direccion' }]
  @ViewChild('buscador') buscador: BuscadorComponent;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Listado de Proveedores');
  }

  abrirFicha(id: number) {
    this.indexTabs = 0;
    this.idProveedor = id;
  }

  async cargarBuscador(value: string) {

    this.buscador.spinner = true;

    let query = this._supabase.supabase.from('proveedores_busqueda').select('*').or(`nombre.ilike.%${value}%, id_proveedor.ilike.%${value}%, cif.ilike.%${value}%`).order('nombre');

    if (!this.buscador.mostrarInactivos) {
      query.eq('activo', true);
    }

    const { data } = await query;

    let resultado = data!?.map(proveedor => { return { id_proveedor: proveedor.id_proveedor, nombre: proveedor.nombre, cif: proveedor.cif, direccion: proveedor.direccion } });

    const indexCodigoIdentico = resultado.findIndex(proveedor => proveedor.id_proveedor === value);

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
        this._title.setTitle('Licojerez - Listado de Proveedores')
        break;
    }
  }
}