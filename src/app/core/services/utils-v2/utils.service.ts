import { EventEmitter, Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { DataUnitTablaTabulator } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { ElementoMenuContextual } from '../../components/oficina/main/main.component';
import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

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

  clickOpcionMenuContextual(opcion: any, opcionPadre?: any, name?: string) {
    this.eventoMenuContextual.emit({ type: 'click', opcion, opcionPadre, name })
  }

  abrirMenuContextual(evento: any, opciones: ElementoMenuContextual[], posicion: { x: number, y: number }, copiar?: any, name?: string) {
    evento.preventDefault();
    this.eventoMenuContextual.emit({ type: 'open', options: opciones, position: posicion, copyElement: copiar, name })
  }

  detectarSiguienteID(listaIDs: number[]): number {
    const set = new Set(listaIDs);
    const min = Math.min(...listaIDs);
    const max = Math.max(...listaIDs);

    for (let i = min; i <= max; i++) {
      if (!set.has(i)) return i;
    }

    return listaIDs[listaIDs.length - 1] + 1;
  }

  identificadorEspanolValidator(): ValidatorFn {
    const regex = /^(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/;

    const dniLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';

    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').toUpperCase().trim();
      if (!value) return null;

      if (!regex.test(value)) {
        return { formatoInvalido: true };
      }

      if (/^\d{8}[A-Z]$/.test(value)) {
        const numero = parseInt(value.slice(0, 8), 10);
        const letraEsperada = dniLetters[numero % 23];
        const letraActual = value[8];
        if (letraEsperada !== letraActual) {
          return { letraIncorrecta: true };
        }
      }

      if (/^[XYZ]\d{7}[A-Z]$/.test(value)) {
        const numeroBase = value.replace('X', '0').replace('Y', '1').replace('Z', '2').slice(0, 8);
        const numero = parseInt(numeroBase, 10);
        const letraEsperada = dniLetters[numero % 23];
        const letraActual = value[8];
        if (letraEsperada !== letraActual) {
          return { letraIncorrecta: true };
        }
      }

      if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) {
        const letraInicial = value[0];
        const digitos = value.substring(1, 8);
        const control = value[8];

        let sumaPar = 0;
        let sumaImpar = 0;

        for (let i = 0; i < digitos.length; i++) {
          const num = parseInt(digitos[i], 10);
          if ((i + 1) % 2 === 0) {
            sumaPar += num;
          } else {
            const doble = num * 2;
            sumaImpar += Math.floor(doble / 10) + (doble % 10);
          }
        }

        const total = sumaPar + sumaImpar;
        const digitoControl = (10 - (total % 10)) % 10;
        const letraControl = 'JABCDEFGHI'[digitoControl];

        const tipoLetra = 'KPQS';
        const tipoNumero = 'ABEH';

        const esControlValido =
          (tipoLetra.includes(letraInicial) && control === letraControl) ||
          (tipoNumero.includes(letraInicial) && control === String(digitoControl)) ||
          (!tipoLetra.includes(letraInicial) &&
            !tipoNumero.includes(letraInicial) &&
            (control === letraControl || control === String(digitoControl)));

        if (!esControlValido) {
          return { digitoControlIncorrecto: true };
        }
      }

      return null;
    };
  }
}