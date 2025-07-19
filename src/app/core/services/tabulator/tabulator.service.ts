import { Injectable } from '@angular/core';
import moment from 'moment';
import { CellComponent, ColumnDefinition } from 'tabulator-tables';

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

  constructor() { }

  getHeaderTablaArticulos(): ColumnDefinition[] {

    let columnas: Columna[] = [
      { title: 'Código', field: 'codigo', type: 'string' },
      { title: 'Nombre', field: 'nombre', type: 'string' },
      { title: 'Precio coste', field: 'precio_coste', type: 'number', formatter: 'money' },
      { title: 'Precio venta', field: 'precio_venta', type: 'number', formatter: 'money' },
      { title: 'EAN13', field: 'ean13', type: 'string' }, //TODO: permitir varios (varias cols en bbdd, en tabulator unificar en mismo string separados por comas)
      { title: 'Fecha Alta', field: 'fecha_alta', type: 'date' },
      { title: 'Stock', field: 'stock', type: 'number' },
      { title: 'Proveedor', field: 'proveedor', type: 'string', dropdown: true },
      { title: 'Familia', field: 'familia', type: 'string', dropdown: true },
      { title: 'Subfamilia', field: 'subfamilia', type: 'string', dropdown: true },
      { title: 'IVA', field: 'iva', type: 'string', dropdown: true, formatter: '%' },
      { title: 'Tipo', field: 'tipo', type: 'string', dropdown: true },
      { title: 'Activo', field: 'activo', type: 'boolean', dropdown: true },
      //{ title: 'Comisión', field: 'comision', type: 'number' },
      { title: 'Referencia', field: 'referencia', type: 'string' },
      { title: 'Nombre TPV', field: 'nombre_tpv', type: 'string' }, //descboton en excel
      { title: 'Tiene lote', field: 'tiene_lote', type: 'boolean', dropdown: true }, //chasis en excel
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
        minWidth: 150
      }

      if (col.type === 'number') {
        nuevaCol.headerFilter = this.minMaxFilterEditor;
        nuevaCol.headerFilterFunc = this.minMaxFilterFunction;
        nuevaCol.headerFilterLiveFilter = false;
      }

      if (col.type === 'date') {
        nuevaCol.sorter = 'datetime';
        nuevaCol.sorterParams = { format: "dd/MM/yyyy" };
        nuevaCol.formatter = (cell) => moment(cell.getValue()).format('DD-MM-YYYY HH:mm:ss');
      }

      if (col.type === 'boolean') {
        nuevaCol.formatter = (cell) => cell.getValue() ? 'Sí' : 'No';
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
            precision: 2,
          }
          nuevaCol.hozAlign = 'right';
        } else {
          nuevaCol.formatter = (cell) => cell.getValue() ? `${cell.getValue()}${col.formatter}` : '';
        }
      }

      if (col.dropdown) {
        nuevaCol.headerFilter = 'list';
        nuevaCol.headerFilterFunc = 'in';
        nuevaCol.headerFilterParams = { valuesLookup: true as any, sort: "asc", multiselect: true, placeholderLoading: 'Cargando resultados...', placeholderEmpty: 'Sin resultados' };
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
}