import { Component, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
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
  public opcionActiva = false;
  public mostrarInactivos = false;
  public spinner: boolean = false;
  @ViewChild(MatAutocomplete) auto!: MatAutocomplete;

  constructor(private _title: Title, private _supabase: SupabaseService, private _renderer: Renderer2) { }

  ngAfterViewInit() {
    this.auto.opened.subscribe(() => {
      setTimeout(() => this.posicionarAutocomplete(), 0);
    });
  }

  onPanelOpened() {
    setTimeout(() => {
      this.posicionarAutocomplete();
    });
  }

  posicionarAutocomplete() {
    const overlayBox = document.querySelector('.cdk-overlay-connected-position-bounding-box');
    if (overlayBox) {
      this._renderer.setStyle(overlayBox, 'display', 'flex');
      this._renderer.setStyle(overlayBox, 'flex-flow', 'row nowrap');
      this._renderer.setStyle(overlayBox, 'justify-content', 'center');
      const hijo = overlayBox.querySelector('.cdk-overlay-pane')
      if (hijo) {
        this._renderer.removeStyle(hijo, 'left')
        this._renderer.removeStyle(hijo, 'right')
      }
    }
  }

  ngOnInit() {
    this._title.setTitle('Licojerez - Listado de Clientes');
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

  alActivarOpcion(event: any) {
    this.opcionActiva = !!event.option;
  }

  onEnter(event: any) {
    if (this.opcionActiva) return;
    event.preventDefault();
    this.seleccionarPrimero();
  }

  activarListenerInputBuscador() {
    this.buscadorCliente.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {
        this.spinner = true;
        if (value === '') {
          this.opcionesBuscadorClientesFiltrado = [];
        } else {

          let query = this._supabase.supabase.from('clientes_busqueda').select('*').or(`nombre.ilike.%${value}%, id_cliente.ilike.%${value}%`).order('nombre');

          if (!this.mostrarInactivos) {
            query.eq('activo', true);
          }

          const { data } = await query;

          let resultado = data!?.map(cliente => { return { id_cliente: cliente.id_cliente, nombre: cliente.nombre, nombre_comercial: cliente.nombre_comercial, domicilio: cliente.domicilio } });

          const indexCodigoIdentico = resultado.findIndex(cliente => cliente.id_cliente === value);

          if (!(indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length)) {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorClientesFiltrado = resultado;
        }
        this.spinner = false;
      }, 200);

    });
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