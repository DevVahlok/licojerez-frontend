import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';

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
  public hasActiveOption = false;

  constructor(private _title: Title, private _supabase: SupabaseService) { }

  ngOnInit() {
    this._title.setTitle('Listado de Proveedores');
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

  onOptionActivated(event: any) {
    this.hasActiveOption = !!event.option;
  }

  onEnter(event: any) {
    if (this.hasActiveOption) return;
    event.preventDefault();
    this.seleccionarPrimero();
  }

  activarListenerInputBuscador() {
    this.buscadorProveedor.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {

        if (value === '') {
          this.opcionesBuscadorProveedoresFiltrado = [];
        } else {
          const { data } = await this._supabase.supabase.from('proveedores_busqueda').select('*').or(`nombre.ilike.%${value}%, id_proveedor.ilike.%${value}%, cif.ilike.%${value}%`);

          let resultado = data!?.map(proveedor => { return { id_proveedor: proveedor.id_proveedor, nombre: proveedor.nombre, cif: proveedor.cif, direccion: proveedor.direccion } });

          const indexCodigoIdentico = resultado.findIndex(proveedor => proveedor.id_proveedor === value);

          if (indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length) {

          } else {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorProveedoresFiltrado = resultado;
        }

      }, 200);

    });
  }

  cambiarTab(index: number) {
    this.indexTabs = index;

    switch (index) {
      case 1:
        this._title.setTitle('Listado de Proveedores')
        break;
    }
  }
}