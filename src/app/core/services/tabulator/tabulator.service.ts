import { Injectable } from '@angular/core';
import moment from 'moment';
import { ConfigTablaTabulator } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { CellComponent, ColumnDefinition } from 'tabulator-tables';
import { UtilsService } from '../utils-v2/utils.service';
import { SupabaseService } from '../supabase/supabase.service';

interface Columna {
  title: string,
  field: string,
  type: 'string' | 'number' | 'date' | 'boolean',
  dropdown?: boolean,
  formatter?: string
}

@Injectable({
  providedIn: 'root'
})
export class TabulatorService {

  public user: any;

  constructor(private _utils: UtilsService, private _supabase: SupabaseService) { }

  getHeaderTablaArticulos(): ColumnDefinition[] {

    const columnas: Columna[] = [
      { title: 'Código', field: 'id_articulo', type: 'string' },
      { title: 'Nombre', field: 'nombre', type: 'string' },
      { title: 'Precio coste', field: 'precio_coste', type: 'number', formatter: 'money' },
      { title: 'Precio venta', field: 'precio_venta', type: 'number', formatter: 'money' },
      { title: 'EAN13', field: 'ean13', type: 'string' },
      { title: 'Fecha Alta', field: 'fecha_alta', type: 'date' },
      { title: 'Stock', field: 'stock', type: 'number' },
      { title: 'Proveedor', field: 'proveedor', type: 'string', dropdown: true },
      { title: 'Familia', field: 'familia', type: 'string', dropdown: true },
      { title: 'Subfamilia', field: 'subfamilia', type: 'string', dropdown: true },
      { title: 'IVA', field: 'iva', type: 'string', dropdown: true, formatter: '%' },
      { title: 'Margen', field: 'margen', type: 'number', formatter: '%' },
      { title: 'Tipo', field: 'tipo', type: 'string', dropdown: true },
      { title: 'Activo', field: 'activo', type: 'boolean', dropdown: true },
      { title: 'Comisión por defecto', field: 'comision_default', type: 'number', formatter: '%' },
      { title: 'Tiene lote', field: 'tiene_lote', type: 'boolean', dropdown: true },
      { title: 'Marca', field: 'marca', type: 'string', dropdown: true },
      { title: 'Grupos', field: 'grupos', type: 'string', dropdown: true }
    ]

    return this.complementarColumnas(columnas);
  }

  getHeaderTablaProveedores(): ColumnDefinition[] {

    const columnas: Columna[] = [
      { title: 'Código', field: 'id_proveedor', type: 'string' },
      { title: 'Nombre', field: 'nombre', type: 'string' },
      { title: 'Activo', field: 'activo', type: 'boolean', dropdown: true },
      { title: 'Dirección', field: 'direccion', type: 'string' },
      { title: 'Código Postal', field: 'codigo_postal', type: 'string' },
      { title: 'Ciudad', field: 'ciudad', type: 'string' },
      { title: 'Provincia', field: 'provincia', type: 'string' },
      { title: 'CIF', field: 'cif', type: 'string' },
      { title: 'Descuento', field: 'descuento', type: 'number', formatter: '%' },
      { title: 'Fecha Alta', field: 'fecha_alta', type: 'string' },
    ]

    return this.complementarColumnas(columnas);
  }

  getHeaderTablaClientes(): ColumnDefinition[] {

    const columnas: Columna[] = [
      { title: 'Código', field: 'id_cliente', type: 'string' },
      { title: 'Activo', field: 'activo', type: 'boolean', dropdown: true },
    ]

    return this.complementarColumnas(columnas);
  }

  private complementarColumnas(listaColumnas: Columna[]): ColumnDefinition[] {

    let devol: ColumnDefinition[] = [];

    listaColumnas.forEach(col => {

      let nuevaCol: ColumnDefinition = {
        title: col.title,
        field: col.field,
        headerFilter: true,
        headerFilterPlaceholder: `Filtrar por ${col.title}...`,
        minWidth: 150,
        hozAlign: 'left'
      }

      if (col.type === 'number') {
        nuevaCol.headerFilter = this.minMaxFilterEditor;
        nuevaCol.headerFilterFunc = this.minMaxFilterFunction;
        nuevaCol.headerFilterLiveFilter = false;
        nuevaCol.hozAlign = 'right';
      }

      if (col.type === 'date') {
        nuevaCol.sorter = 'datetime';
        nuevaCol.sorterParams = { format: "dd/MM/yyyy" };
        nuevaCol.formatter = (cell) => moment(cell.getValue()).format('DD-MM-YYYY HH:mm:ss');
        nuevaCol.hozAlign = 'center';
      }

      if (col.type === 'boolean') {
        nuevaCol.hozAlign = 'center';
      }

      if (col.formatter) {
        if (col.formatter === 'money') {
          nuevaCol.formatter = 'money';
          nuevaCol.formatterParams = {
            decimal: ",",
            thousand: ".",
            symbol: "€",
            symbolAfter: true,
            negativeSign: true,
            precision: 4,
          }
          nuevaCol.hozAlign = 'right';
        } else {
          nuevaCol.formatter = (cell) => cell.getValue() !== null ? `${cell.getValue()}${col.formatter}` : '';
        }
      }

      if (col.dropdown) {
        nuevaCol.headerFilter = 'list';
        nuevaCol.headerFilterFunc = 'in';
        nuevaCol.headerFilterParams = { valuesLookup: 'active', sort: "asc", multiselect: true, placeholderLoading: 'Cargando resultados...', placeholderEmpty: 'Sin resultados' };

        if (col.type === 'boolean') {
          nuevaCol.headerFilterParams.values = ['Sí', 'No'];
          delete nuevaCol.headerFilterParams.valuesLookup;
        }
      }

      devol.push(nuevaCol)
    })

    return devol;
  }

  minMaxFilterEditor(cell: CellComponent, onRendered: any, success: any, cancel: any, editorParams: any): any {
    let end: any;

    let container = document.createElement('span');

    //create and style inputs
    let start = document.createElement('input');
    start.setAttribute('type', 'number');
    start.setAttribute('placeholder', 'Mín.');
    start.setAttribute('min', '0');
    start.setAttribute('max', '100');
    start.style.padding = '4px';
    start.style.width = '50%';
    start.style.boxSizing = 'border-box';

    start.value = cell.getValue();

    function buildValues() {
      success({
        start: start.value,
        end: end.value,
      });
    }

    function keypress(e: any) {
      if (e.keyCode === 27) {
        cancel();
      } else {
        buildValues();
      }
    }

    end = start.cloneNode();
    end.setAttribute('placeholder', 'Máx.');

    start.addEventListener('change', buildValues);
    start.addEventListener('blur', buildValues);
    start.addEventListener('input', buildValues);
    start.addEventListener('keydown', keypress);

    end.addEventListener('change', buildValues);
    end.addEventListener('blur', buildValues);
    end.addEventListener('input', buildValues);
    end.addEventListener('keydown', keypress);

    container.appendChild(start);
    container.appendChild(end);

    return container;
  }

  minMaxFilterFunction(headerValue: any, rowValue: any, rowData: any, filterParams: any): any {
    if (rowValue || rowValue === 0) {
      if (headerValue.start != '') {
        if (headerValue.end != '') {
          return (
            Number(rowValue) >= Number(headerValue.start) &&
            Number(rowValue) <= Number(headerValue.end)
          );
        } else {
          return Number(rowValue) >= Number(headerValue.start);
        }
      } else {
        if (headerValue.end != '') {
          return Number(rowValue) <= Number(headerValue.end);
        }
      }
    }
    return true;
  }

  async tratamientoConfigTabla(cabecera: ColumnDefinition[], viewname: string, config: ConfigTablaTabulator[]): Promise<ConfigTablaTabulator[]> {

    if (!this.user) {
      this.user = await this._supabase.getUser();
    }

    if (!config || config.length === 0) {
      config = cabecera.map((col, i) => { return { field: col.field, visible: true, order: i + 1, width: 150 } as ConfigTablaTabulator });
      await this._supabase.supabase.from('config_componentes').insert({ viewname, user: this.user.username, config });
    } else {
      let configModificada = false;

      cabecera.forEach(col => {
        if (!config.find(e => col.field === e.field)) {
          config.push({ field: col.field!, order: config.length, visible: true, width: 150 });
          configModificada = true;
        }
      });

      for (let i = config.length - 1; i >= 0; i--) {
        if (!cabecera.find(col => col.field === config[i].field)) {
          config.splice(i, 1);
        }
      }

      if (configModificada) {
        await this._supabase.supabase.from('config_componentes').update({ config }).eq('viewname', viewname).eq('user', this.user.username);
      }
    }

    return config;
  }
}