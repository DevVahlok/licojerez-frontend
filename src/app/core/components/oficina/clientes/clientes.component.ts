import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { BuscadorComponent } from 'src/app/shared/components/buscador/buscador.component';

export interface ElementoDesplegable {
  codigo: string,
  nombre: string
}

interface opcionBuscadorCliente {
  id_cliente: number,
  nombre: string,
  nombre_comercial: string,
  domicilio: string
}

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent {

  public idCliente: number;
  public indexTabs = 0;
  public listaResultadosBuscador: opcionBuscadorCliente[] | null = null;
  public listaColumnasBuscador: { title: string, field: string, unidad?: string }[] = [{ title: 'Código', field: 'id_cliente' }, { title: 'Nombre Fiscal', field: 'nombre' }, { title: 'Nombre Comercial', field: 'nombre_comercial' }, { title: 'Domicilio', field: 'domicilio' }, { title: 'CIF', field: 'cif' }]
  @ViewChild('buscador') buscador: BuscadorComponent;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Licojerez - Listado de Clientes');
  }

  abrirFicha(id: number) {
    this.indexTabs = 0;
    this.idCliente = id;
  }

  async cargarBuscador(value: string) {
    this.buscador.spinner = true;

    let query = this._supabase.supabase.from('clientes_busqueda').select('*').or(`nombre.ilike.%${value}%, id_cliente.ilike.%${value}%, nombre_comercial.ilike.%${value}%, domicilio.ilike.%${value}%, cif.ilike.%${value}%, nombres_centros.ilike.%${value}%`).order('nombre');

    if (!this.buscador.mostrarInactivos) {
      query.eq('activo', true);
    }

    const { data } = await query;

    let resultado = data!?.map(cliente => { return { id_cliente: cliente.id_cliente, nombre: cliente.nombre, nombre_comercial: `${cliente.nombre_comercial} ${cliente.nombres_centros ? '(' + cliente.nombres_centros + ')' : ''}`, domicilio: cliente.domicilio, cif: cliente.cif } });

    const indexCodigoIdentico = resultado.findIndex(cliente => cliente.id_cliente === value);

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
        this._title.setTitle('Licojerez - Listado de Clientes')
        break;
    }
  }
}