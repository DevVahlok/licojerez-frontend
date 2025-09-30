import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';
import Tabulator, { ColumnDefinition, RowComponent } from 'tabulator-tables';
import TabulatorTable from 'tabulator-tables';
import { TabulatorFull } from 'tabulator-tables';
import { DialogConfigTabla } from '../../dialogs/dialog-config-tabla/dialog-config-tabla';

export interface DataTablaTabulator {
  tableData: DataUnitTablaTabulator[][],
  cabecera: Tabulator.ColumnDefinition[],
  config?: ConfigTablaTabulator[],
  options: {
    title?: string,
    height: string,
    movableColumns?: boolean,
    layout?: 'fitData' | 'fitColumns' | 'fitDataFill' | 'fitDataStretch' | 'fitDataTable',
    initialSort?: TabulatorTable.Sorter[],
    resizableColumns?: boolean,
    initialHeaderFilter?: { field: string, value: string | string[] }[],
    selectable?: boolean,
    actionBar?: {
      upload?: boolean,
      download?: boolean,
      config?: boolean
    },
    index?: string
  },
  styles?: {
    theme?: 'light' | 'dark'
  }
}

export interface TablaTabulatorEvent {
  type: 'tabla-tabulator',
  name: string,
  action: 'columnMoved' | 'rowClick' | 'cellClick' | 'cellContext' | 'tableBuilt' | 'upload' | 'columnResized' | 'configChanged' | 'filtersCleared' | 'rowSelected' | 'rowDeselected' | 'rowSelectionChanged' | 'dataFiltered' | 'cellDblClick',
  value: ConfigTablaTabulator | any
}

export interface ConfigTablaTabulator {
  title?: string,
  field: string,
  visible: boolean,
  order: number,
  width: number
}

export interface DataUnitTablaTabulator {
  field: string,
  value: string
}

@Component({
  selector: 'app-tabla-tabulator',
  templateUrl: './tabla-tabulator.component.html',
  styleUrls: ['./tabla-tabulator.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class TablaTabulatorComponent implements OnInit {

  @Output() emitter: EventEmitter<TablaTabulatorEvent> = new EventEmitter();
  @ViewChild('tablaTabulator') tablaTabulator: ElementRef;
  public elementoTabla: HTMLElement = document.createElement('div');
  @Input() data: DataTablaTabulator;
  @Input() name: string;
  public numResultados: number = 0;
  public numResultadosSeleccionados: number = 0;
  public tabla: TabulatorFull;
  public filtrosEnUso: boolean = false;
  public visibilidadSpinner: boolean = false;

  constructor(private _utils: UtilsService, private _dialog: MatDialog) { }

  ngOnInit(): void { }

  ngAfterViewInit() {
    setTimeout(() => this.dibujarTabla(), 0)
  }

  private dibujarTabla() {

    this.tabla = new TabulatorFull(this.elementoTabla, this.configurarTabla());

    this.administrarEventosTabulator();

    this.tablaTabulator?.nativeElement.insertAdjacentElement('afterend', this.elementoTabla);
  }

  private configurarTabla(): TabulatorTable.Options {

    if (this.data.config) {

      const map2 = new Map(this.data.config.map(obj => [obj.field, obj]));

      const array1Modificado = this.data.cabecera.map(col => {
        const config = map2.get(col.field!);
        if (config) {
          return { ...col, width: config.width, visible: config.visible, order: config.order };
        }
        return col;
      });

      this.data.cabecera = this._utils.ordenarObjectArrayPorPropiedad(array1Modificado, 'order') as ColumnDefinition[];
    }

    let tableOptions: TabulatorTable.Options = {
      data: this.formatearDatosTabulator(this.data.tableData),
      reactiveData: true,
      columns: this.data.cabecera,
      height: this.data.options.height,
      headerFilterLiveFilterDelay: 0,
      debugInvalidOptions: false,
      index: this.data?.options?.index
    }

    tableOptions?.columns?.forEach(col => {
      col.resizable = this.data?.config ? true : !!this.data?.options?.resizableColumns;
    })

    this.data?.options?.movableColumns !== undefined ? tableOptions.movableColumns = this.data?.options?.movableColumns : tableOptions.movableColumns = false;
    this.data?.options?.layout ? tableOptions.layout = this.data?.options?.layout : tableOptions.layout = 'fitData';
    this.data?.options?.initialSort ? tableOptions.initialSort = this.data?.options?.initialSort : tableOptions.initialSort = [];
    this.data?.options?.initialHeaderFilter ? tableOptions.initialHeaderFilter = this.data?.options?.initialHeaderFilter : tableOptions.initialHeaderFilter = [];
    this.data?.options?.selectable ? tableOptions.selectableRows = true : tableOptions.selectableRows = false;

    return tableOptions;
  }

  sustituirDatos(newData: DataUnitTablaTabulator[][]) {
    this.tabla.replaceData(this.formatearDatosTabulator(newData))
  }

  public formatearDatosTabulator(data: DataUnitTablaTabulator[][]): TabulatorTable.ColumnDefinition[] {
    let listaColumnas: TabulatorTable.ColumnDefinition[] = [];

    data.forEach(element => {
      let columna: TabulatorTable.ColumnDefinition = { title: '', field: '' };
      element.forEach(e => {
        (columna as any)[e.field] = e.value;
      });
      listaColumnas.push(columna)
    });

    return listaColumnas;
  }

  contarColumnas() {
    if (this.tabla) {
      return this.tabla.getColumns().filter(col => col.isVisible()).length;
    } else {
      return 0;
    }
  }

  descargarTabla(formato: Tabulator.DownloadType | 'png' | MouseEvent) {

    let opcionesDescarga: Tabulator.DownloadCSV | Tabulator.DownloadXLXS | Tabulator.DownloadPDF;
    let titulo: string;

    titulo = this.data?.options?.title ? this.data.options.title : 'Tabla'

    if (titulo.length > 30) titulo = titulo.substring(0, 30);

    switch (formato) {

      case 'pdf':
        opcionesDescarga = {
          title: titulo,
          orientation: 'landscape',
          autoTable: {
            headStyles: {
              fillColor: [255, 121, 0],
              font: 'helvetica',
              textColor: [0, 0, 0],
              overflow: 'linebreak'
            },
            bodyStyles: {
              overflow: 'linebreak',
              minCellWidth: 100
            },
            margin: { top: 50, right: 5, bottom: 0, left: 15 },
            styles: {
              cellWidth: 'auto',
              overflow: 'linebreak'
            },
            pageBreak: 'auto',
            tableWidth: 'auto',
            horizontalPageBreak: true
          }
        }
        break;

      case 'csv':
        opcionesDescarga = { delimiter: ";" } as Tabulator.DownloadCSV;
        break;

      case 'xlsx':
        opcionesDescarga = { sheetName: titulo };
        break;

      case 'png':
        this._utils.downloadElementToPng(this.elementoTabla, titulo);
        break;
    }

    if (formato !== 'png') this.tabla.download(formato as any, `${titulo}.${formato}`, opcionesDescarga!);
  }

  limpiarFiltros() {
    this.tabla.clearFilter(true);
    this.tabla.getColumns().forEach(col => {
      col.getElement().getElementsByClassName('tabulator-col-title')[0].innerHTML = col.getDefinition().title;
    })
    this.emitter.emit({ type: 'tabla-tabulator', action: 'filtersCleared', name: this.name, value: true })
  }

  enviarEventoUpload() {
    this.emitter.emit({ type: 'tabla-tabulator', action: 'upload', name: this.name, value: null })
  }

  abrirDialogConfigs() {

    let columnas = structuredClone(this.data.config)!;

    columnas.forEach((e: any) => {
      e.title = this.tabla.getColumns().find(e2 => e2.getField() === e.field)!.getDefinition().title
    });

    this._dialog.open(DialogConfigTabla, { width: '500px', data: { listaColumnas: columnas }, disableClose: true }).afterClosed().subscribe((res: any) => {

      if (res) {

        res.forEach((e: any) => delete e.title);

        let columnas = this.tabla.getColumns()

        columnas.forEach((col, i) => {

          col.getDefinition().visible = res.find((e: any) => e.field === col.getField()).visible;

          (col as any)['order'] = res.find((e: any) => e.field === col.getField()).order;
        })

        columnas = this._utils.ordenarObjectArrayPorPropiedad(columnas, 'order')!;

        columnas.forEach((e: any) => delete e.order);

        this.tabla.setColumns(columnas.map(col => col.getDefinition()))

        this.emitter.emit({ type: 'tabla-tabulator', action: 'configChanged', name: this.name, value: res })
      }

    })
  }

  administrarEventosTabulator() {

    let tablaCargada: boolean = false;

    this.tabla.on('tableBuilt', () => {
      this.tabla.redraw(true)
      tablaCargada = true;
      this.filtrosEnUso = this.tabla.getFilters(true).length > 0;
      this.emitter.emit({ type: 'tabla-tabulator', action: 'tableBuilt', name: this.name, value: true });
    })

    this.tabla.on('dataLoaded', (datos) => {
      if (this.tabla) this.numResultados = (this.tabla as any).getRows(true).length;
    })

    let procesoFiltrado = false;

    this.tabla.on('dataFiltered', async (filtros, filas) => {
      this.numResultados = filas.length;
      if (tablaCargada) this.filtrosEnUso = filtros.length > 0;

      if (!procesoFiltrado) {
        filtros.forEach(e => {
          if (e.value === '!!') {
            if (!this.tabla.getFilters(true).find(e2 => e2.field === e.field && e2.value === '')) {
              procesoFiltrado = true;
              this.tabla.getColumn(e.field).setHeaderFilterValue('');
              this.tabla.addFilter(e.field, '=', '');
              this.tabla.getColumn(e.field).getElement().getElementsByClassName('tabulator-col-title')[0].innerHTML = `${this.tabla.getColumn(e.field).getDefinition().title} <span class="material-symbols-outlined">filter_alt</span>`;
              this.refrescarTablaFiltros();
              procesoFiltrado = false;
            } else {
              procesoFiltrado = true;
              this.tabla.getColumn(e.field).setHeaderFilterValue('')
              this.tabla.removeFilter(e.field, '=', '');
              this.tabla.getColumn(e.field).getElement().getElementsByClassName('tabulator-col-title')[0].innerHTML = this.tabla.getColumn(e.field).getElement().getElementsByClassName('tabulator-col-title')[0].innerHTML.replace(' <span class="material-symbols-outlined">filter_alt</span>', '');
              this.refrescarTablaFiltros();
              procesoFiltrado = false;
            }
          }
        });
        this.emitter.emit({ type: 'tabla-tabulator', action: 'dataFiltered', name: this.name, value: null });
      }

    })

    this.tabla.on('dataChanged', (datos) => {
      this.numResultados = datos.length;
    })

    this.tabla.on('rowClick', (evento, row) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'rowClick', name: this.name, value: row })
    })

    this.tabla.on('cellClick', (evento, celda) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'cellClick', name: this.name, value: celda })
    })

    this.tabla.on('cellDblClick', (evento, celda) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'cellDblClick', name: this.name, value: celda })
    })

    this.tabla.on('cellContext', (evento, celda) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'cellContext', name: this.name, value: { event: evento, celda } })
    })

    this.tabla.on('columnMoved', (column, columns) => {

      let nuevaConfig = structuredClone(this.data.config)!;

      let nuevaPosicion = columns.findIndex(e => e.getField() === column.getField());

      nuevaConfig.splice(nuevaPosicion, 0, nuevaConfig.splice(nuevaConfig.findIndex((e: any) => e.field === column.getField()), 1)[0]);

      nuevaConfig.forEach((e: any, i: any) => e.order = i + 1);

      this.emitter.emit({ type: 'tabla-tabulator', action: 'columnMoved', name: this.name, value: nuevaConfig })
    })

    this.tabla.on('columnResized', (column) => {

      let nuevaConfig = structuredClone(this.data.config)!;

      nuevaConfig.find((e: any) => e.field === column.getField())!.width = column.getWidth();

      this.emitter.emit({ type: 'tabla-tabulator', action: 'columnResized', name: this.name, value: nuevaConfig })
    })

    this.tabla.on("rowSelected", (row) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'rowSelected', name: this.name, value: row })
    });

    this.tabla.on("rowDeselected", (row) => {
      this.emitter.emit({ type: 'tabla-tabulator', action: 'rowDeselected', name: this.name, value: row })
    });

    this.tabla.on("rowSelectionChanged", () => {
      this.numResultadosSeleccionados = this.tabla.getSelectedRows().length;
      this.emitter.emit({ type: 'tabla-tabulator', action: 'rowSelectionChanged', name: this.name, value: { selectedData: this.tabla.getSelectedData(), selectedRows: this.tabla.getSelectedRows() } })
    });
  }

  toggleSeleccionarTodos(activar: boolean) {
    activar ? this.tabla.selectRow("active") : this.tabla.deselectRow();
  }

  async refrescarTablaFiltros() {
    await this._utils.delay(10);
    this.tabla.refreshFilter();
  }
}