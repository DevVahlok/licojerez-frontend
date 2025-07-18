import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { UtilsService } from '../../../services/utils-v2/utils.service';
import { Title } from '@angular/platform-browser';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';
import { forkJoin, from, Observable, tap } from 'rxjs';
import { TabulatorService } from 'src/app/core/services/tabulator/tabulator.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(private _title: Title, private _supabase: SupabaseService, private _utils: UtilsService, private _tabulator: TabulatorService, private _snackbar: MatSnackBar) { }

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
          cabecera: this._tabulator.getHeaderTablaArticulos(),
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

  async onFileChange(evento: any) {
    this.componenteTabla.visibilidadSpinner = true;
    const respuesta = await this._supabase.subirExcelTablaArticulos(evento.target.files[0]);

    if (!respuesta.success) {
      this._snackbar.open(`Ha habido un error al añadir los artículos.`, undefined, { duration: 7000 });
    }

    this.componenteTabla.visibilidadSpinner = false;
  }

  abrirDialogAdjuntarArchivo() {
    this.inputArchivo.nativeElement.click();
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