import { Component, ElementRef, ViewChild } from '@angular/core';
import { DataTablaTabulator, DataUnitTablaTabulator, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import * as XLSX from 'xlsx';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { UtilsService } from '../../services/utils-v2/utils.service';

@Component({
  selector: 'app-lista-articulos',
  templateUrl: './lista-articulos.component.html',
  styleUrls: ['./lista-articulos.component.scss']
})
export class ListaArticulosComponent {
  public datosTabla: DataTablaTabulator | null;
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
  @ViewChild('inputArchivo') inputArchivo: ElementRef;

  constructor(private _supabase: SupabaseService, private _utils: UtilsService) { }

  async ngOnInit() {
    console.log('entra');

    const { data, error } = await this._supabase.supabase.from('articulos').select('*');

    //TODO: aplicar loading manager
    let filas: DataUnitTablaTabulator[][] = []

    data?.forEach(row => {

      let fila: DataUnitTablaTabulator[] = [];

      for (let key in row) {
        fila.push({ field: key, value: row[key] })
      }

      filas.push(fila)
    })

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
      tableData: filas,
      options: {
        title: 'Lista de Artículos',
        height: '500px',
        layout: 'fitDataStretch',
        actionBar: {
          config: false,
          download: false,
          upload: true
        }
      },
      styles: {
        theme: 'dark'
      }
    }
  }

  async onFileChange(evt: any) {

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
        this.datosTabla = null;
        await this._utils.delay(200);
        this.ngOnInit();
      }
    };

    reader.readAsBinaryString(file);
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

      case 'upload':
        this.inputArchivo.nativeElement.click()
        break;
    }
  }
}