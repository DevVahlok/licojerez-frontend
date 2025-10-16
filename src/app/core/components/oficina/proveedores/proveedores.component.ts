import { Overlay } from '@angular/cdk/overlay';
import { Component, Renderer2, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';

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
  public buscadorProveedor = new FormControl('');
  public opcionesBuscadorProveedores: opcionBuscadorProveedor[] = [];
  public opcionesBuscadorProveedoresFiltrado: opcionBuscadorProveedor[] = [];
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
    this._title.setTitle('Licojerez - Listado de Proveedores');
    this.activarListenerInputBuscador();
  }

  abrirFicha(id: number) {
    this.buscadorProveedor.setValue('');
    this.indexTabs = 0;
    this.idProveedor = id;
  }

  seleccionarPrimero() {
    const opciones = this.opcionesBuscadorProveedoresFiltrado;
    if (opciones.length > 0) this.abrirFicha(opciones[0].id_proveedor)
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
    this.buscadorProveedor.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {
        this.spinner = true;
        if (value === '') {
          this.opcionesBuscadorProveedoresFiltrado = [];
        } else {

          let query = this._supabase.supabase.from('proveedores_busqueda').select('*').or(`nombre.ilike.%${value}%, id_proveedor.ilike.%${value}%, cif.ilike.%${value}%`).order('nombre');

          if (!this.mostrarInactivos) {
            query.eq('activo', true);
          }

          const { data } = await query;

          let resultado = data!?.map(proveedor => { return { id_proveedor: proveedor.id_proveedor, nombre: proveedor.nombre, cif: proveedor.cif, direccion: proveedor.direccion } });

          const indexCodigoIdentico = resultado.findIndex(proveedor => proveedor.id_proveedor === value);

          if (!(indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length)) {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorProveedoresFiltrado = resultado;
          setTimeout(() => this.posicionarAutocomplete(), 1);
        }
        this.spinner = false;
      }, 200);

    });
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