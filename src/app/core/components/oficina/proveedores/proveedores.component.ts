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
  nombre_fiscal: string,
  nombre_comercial: string,
  cif: string,
  nombre_centro: string[]
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

  activarListenerInputBuscador() {
    /*     this.buscadorProveedor.valueChanges.subscribe(async value => {
          clearTimeout(this.timer);
    
          if (!value) value = '';
          value = value.replace(/,/g, ' ');
    
          this.timer = setTimeout(async () => {
    
            if (value === '') {
              this.opcionesBuscadorProveedoresFiltrado = [];
            } else {
             // const { data } = await this._supabase.supabase.from('articulos_busqueda').select('*').or(`nombre.ilike.%${value}%, id_articulo.ilike.%${value}%, ean13_1.ilike.%${value}%, ean13_2.ilike.%${value}%, ean13_3.ilike.%${value}%, ean13_4.ilike.%${value}%, ean13_5.ilike.%${value}%`);
              const { data } = await this._supabase.supabase.from('proveedores_busqueda').select('*').or(`nombre.ilike.%${value}%, id_articulo.ilike.%${value}%, ean13_1.ilike.%${value}%, ean13_2.ilike.%${value}%, ean13_3.ilike.%${value}%, ean13_4.ilike.%${value}%, ean13_5.ilike.%${value}%`);
    
              let resultado = data!?.map(articulo => { return { id_articulo: articulo.id_articulo, nombre: articulo.nombre, ean13: [articulo.ean13_1, articulo.ean13_2, articulo.ean13_3, articulo.ean13_4, articulo.ean13_5] } });
    
              const indexCodigoIdentico = resultado.findIndex(articulo => articulo.id_articulo === value);
    
              if (indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length) {
    
              } else {
                const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
                resultado.unshift(elemento);
              }
    
              this.opcionesBuscadorProveedoresFiltrado = resultado;
            }
    
          }, 200);
    
        }); */
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