import { EventEmitter, Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { DataUnitTablaTabulator } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';

@Injectable({
  providedIn: 'root'
})

export class UtilsService {
  public eventoMenuContextual: EventEmitter<any> = new EventEmitter();
  public eventoGetBanners: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ordenarObjectArrayPorPropiedad(arr: Array<object>, propiedad: string): Array<any> | undefined {

    if (arr !== undefined) {
      return arr.sort((a: any, b: any) => Number(a[propiedad]) < Number(b[propiedad]) ? -1 : (Number(a[propiedad]) > Number(b[propiedad]) ? 1 : 0));
    } else {
      return undefined;
    }

  }

  downloadElementToPng(element: HTMLElement, title?: string): Blob | null {
    html2canvas(element).then((canvas: any) => {
      canvas.toBlob((blob: Blob) => {
        saveAs(blob, `${title ? title : 'Tabla'}.png`);
        return blob;
      });
    });
    return null;
  }

  delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  convertirEnFormatoTabla(listaObjetos: any[]): DataUnitTablaTabulator[][] {
    let filas: DataUnitTablaTabulator[][] = []

    listaObjetos?.forEach(row => {
      let fila: DataUnitTablaTabulator[] = [];
      for (let key in row) {
        fila.push({ field: key, value: row[key] })
      }
      filas.push(fila);
    });

    return filas;
  }
}