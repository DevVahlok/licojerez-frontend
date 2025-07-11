import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import * as XLSX from 'xlsx';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { UtilsService } from '../../../services/utils-v2/utils.service';
import { Title } from '@angular/platform-browser';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';
import { forkJoin, from, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-lista-articulos',
  templateUrl: './lista-articulos.component.html',
  styleUrls: ['./lista-articulos.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListaArticulosComponent {
  public datosTabla: DataTablaTabulator;
  public cargaTablaArticulos: number = 0;
  @ViewChild('inputArchivo') inputArchivo: ElementRef;
  @ViewChild('componenteTabla') componenteTabla: TablaTabulatorComponent;



  public columnMap: { [key: string]: string } = {
    'descripcion': 'nombre',
    'codigo': 'codigo',
    'costo': 'precio_coste',
    'alta': 'fecha_alta',
    'ean13': 'ean13',
    'existencia': 'stock'
  };
  // Campos que deben ser convertidos a número
  public numericFields = ['precio_coste', 'ean13', 'stock'];
  public dateFields = ['fecha_alta'];



  constructor(private _title: Title, private _supabase: SupabaseService, private _utils: UtilsService) { }

  ngOnInit() {
    this._title.setTitle('Artículos');
    this.cargarTablaArticulos();
  }

  cargarTablaArticulos() {
    this.cargaTablaArticulos = 0;

    const listaLlamadas: Array<Observable<any>> = [
      from(this._supabase.supabase.from('articulos').select('*'))
    ]

    forkJoin(listaLlamadas.map((obs$) => obs$.pipe(tap(() => { if (this.cargaTablaArticulos !== -1) this.cargaTablaArticulos += 100 / listaLlamadas.length })))).subscribe({
      next: ([{ data }]) => {
        this.datosTabla = {
          cabecera: [
            { title: 'Código', field: 'codigo', headerFilter: true, headerFilterPlaceholder: 'Filtrar por Código...' },
            { title: 'Nombre', field: 'nombre', headerFilter: true, headerFilterPlaceholder: 'Filtrar por Nombre...' },
            { title: 'EAN13', field: 'ean13' },
            { title: 'Fecha Alta', field: 'fecha_alta' },
            { title: 'Stock', field: 'stock' },
            { title: 'Precio coste', field: 'precio_coste' },
            //{ title: 'Tipo', field: 'tipo' },
          ],
          tableData: this._utils.convertirEnFormatoTabla(data),
          options: {
            title: 'Lista de Artículos',
            height: '500px',
            layout: 'fitDataStretch',
            actionBar: { config: true, download: true, upload: false }
          },
          styles: { theme: 'dark' }
        }
      },
      error: (err) => {
        this.cargaTablaArticulos = -1;
      }
    });
  }

  async onFileChange(evt: any) {

    this.componenteTabla.visibilidadSpinner = true;

    const file = evt.target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true // Esto permite que XLSX devuelva objetos Date
      });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { raw: true });

      // Mapeo con conversión de tipos
      const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        for (const key in row) {
          const dbField = this.columnMap[key];
          if (!dbField) continue;

          let value = row[key];

          if (this.numericFields.includes(dbField)) {
            const numberValue = Number(value);
            newRow[dbField] = isNaN(numberValue) ? null : numberValue;

          } else if (this.dateFields.includes(dbField)) {
            if (value instanceof Date) {
              // Convertir a ISO format
              newRow[dbField] = value.toISOString().split('T')[0]; // yyyy-mm-dd
            } else if (typeof value === 'number') {
              // Si es un número serial de Excel, convertirlo
              const date = XLSX.SSF.parse_date_code(value);
              if (date) {
                const jsDate = new Date(date.y, date.m - 1, date.d);
                newRow[dbField] = jsDate.toISOString().split('T')[0];
              }
            } else if (typeof value === 'string') {
              // Intentar parsear una fecha desde texto
              const parsed = new Date(value);
              newRow[dbField] = isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
            } else {
              newRow[dbField] = null;
            }

          } else {
            newRow[dbField] = value;
          }
        }
        return newRow;
      });


      const { error } = await this._supabase.supabase.from('articulos').insert(mappedData);

      if (error) {
        console.error('Error al insertar en Supabase:', error);
      } else {
        console.log('Datos insertados correctamente');
      }
    };

    reader.readAsBinaryString(file);
  }

  abrirDialogAdjuntarArchivo() {
    this.inputArchivo.nativeElement.click()
  }

  recibirEventosTabulator(evento: TablaTabulatorEvent) {

    switch (evento.action) {
      case 'columnMoved':
      case 'columnResized':
      case 'configChanged':
        // this.guardarConfigTabla(evento)
        break;

      case 'cellContext':
        // this.clickDerechoCelda(evento)
        break;
    }
  }

  eventosLoadingManager(evento: LoadingManagerEvent) {
    if (evento.type === 'reload') this.cargarTablaArticulos();
  }
}