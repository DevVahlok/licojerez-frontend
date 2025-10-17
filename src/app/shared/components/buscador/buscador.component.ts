import { Component, EventEmitter, Input, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BuscadorComponent {

  @Input() listaResultados: any = null;
  @Input() listaColumnas: { title: string, field: string, unidad?: string }[];
  @Input() clasePadre: string;
  @Input() elemento: string;
  public opcionActiva: boolean = false;
  public mostrarInactivos: boolean = false;
  public spinner: boolean = false;
  public buscadorArticulo = new FormControl('');
  @Output() input = new EventEmitter<string>();
  @Output() seleccionado = new EventEmitter<any>();
  private timer: NodeJS.Timeout;
  public indiceSeleccionado: number;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['listaResultados']) {
      this.indiceSeleccionado = 0;
    }
  }

  alActivarOpcion(event: any) {
    this.opcionActiva = !!event.option;
  }

  teclaPulsada(event: KeyboardEvent) {
    if (this.listaResultados) {
      const lastIndex = this.listaResultados.length - 1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.indiceSeleccionado =
          this.indiceSeleccionado < lastIndex ? this.indiceSeleccionado + 1 : 0;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.indiceSeleccionado =
          this.indiceSeleccionado > 0 ? this.indiceSeleccionado - 1 : lastIndex;
      } else if (event.key === 'Enter' && this.indiceSeleccionado >= 0) {
        this.seleccionarFila(this.listaResultados[this.indiceSeleccionado]);
      }
    }
  }

  actualizarBuscador() {
    if (this.buscadorArticulo.value === '') {
      this.listaResultados = null;
    } else {

      clearTimeout(this.timer);

      let valor = structuredClone(this.buscadorArticulo.value)!;

      if (!valor) valor = '';
      valor = valor.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {
        this.input.emit(valor);
      }, 200);
    }
  }

  seleccionarFila(fila: any) {
    this.seleccionado.emit(fila);
    this.buscadorArticulo.setValue('');
  }
}