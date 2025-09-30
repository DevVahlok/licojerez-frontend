import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';

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
  public buscadorCliente = new FormControl('');
  public opcionesBuscadorClientes: opcionBuscadorCliente[] = [];
  public opcionesBuscadorClientesFiltrado: opcionBuscadorCliente[] = [];
  private timer: NodeJS.Timeout;
  public hasActiveOption = false;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Listado de Clientes');
    this.activarListenerInputBuscador();
  }

  abrirFicha(id: number) {
    this.buscadorCliente.setValue('');
    this.indexTabs = 0;
    this.idCliente = id;
  }

  seleccionarPrimero() {
    const opciones = this.opcionesBuscadorClientesFiltrado;
    if (opciones.length > 0) this.abrirFicha(opciones[0].id_cliente)
  }

  onOptionActivated(event: any) {
    this.hasActiveOption = !!event.option;
  }

  onEnter(event: any) {
    if (this.hasActiveOption) return;
    event.preventDefault();
    this.seleccionarPrimero();
  }

  activarListenerInputBuscador() {
    this.buscadorCliente.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {

        if (value === '') {
          this.opcionesBuscadorClientesFiltrado = [];
        } else {
          const { data } = await this._supabase.supabase.from('clientes_busqueda').select('*').or(`nombre.ilike.%${value}%, id_cliente.ilike.%${value}%`);

          let resultado = data!?.map(cliente => { return { id_cliente: cliente.id_cliente, nombre: cliente.nombre, nombre_comercial: cliente.nombre_comercial, domicilio: cliente.domicilio } });

          const indexCodigoIdentico = resultado.findIndex(cliente => cliente.id_cliente === value);

          if (indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length) {

          } else {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorClientesFiltrado = resultado;
        }

      }, 200);

    });
  }

  cambiarTab(index: number) {
    this.indexTabs = index;

    switch (index) {
      case 1:
        this._title.setTitle('Listado de Clientes')
        break;
    }
  }
}