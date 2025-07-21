import { Component, ElementRef, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { UtilsService } from '../../../services/utils-v2/utils.service';
import { Title } from '@angular/platform-browser';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';
import { forkJoin, from, Observable, tap } from 'rxjs';
import { TabulatorService } from 'src/app/core/services/tabulator/tabulator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

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
  @ViewChild('dialogErrorExcel') dialogErrorExcel: TemplateRef<any>;
  public errorExcel: { message: string, field: string, data: { nombre: string }[] };

  constructor(private _title: Title, private _supabase: SupabaseService, private _utils: UtilsService, private _tabulator: TabulatorService, private _snackbar: MatSnackBar, public _dialog: MatDialog) { }

  ngOnInit() {
    this._title.setTitle('Artículos');
    this.cargarTablaArticulos();
  }

  cargarTablaArticulos() {
    this.cargaTablaArticulos = 0;

    const listaLlamadas: Array<Observable<any>> = [
      from(this._supabase.supabase.from('articulos').select('*, proveedores(nombre), familias(nombre), subfamilias(nombre), ivas(valor_iva), marcas(nombre), articulos_grupos(grupo_codigo,  grupos_articulos(nombre))').order('codigo')),
      from(this._supabase.supabase.from('grupos_articulos').select('nombre').order('codigo'))
    ]

    forkJoin(listaLlamadas.map((obs$) => obs$.pipe(tap(() => { if (this.cargaTablaArticulos !== -1) this.cargaTablaArticulos += 100 / listaLlamadas.length })))).subscribe({
      next: ([{ data: filas }, { data: listaGrupos }]) => {

        filas = this.tratamientoFilas(filas);

        let cabecera = this._tabulator.getHeaderTablaArticulos();

        let columnaGrupos = cabecera.find(col => col.field === 'grupos');
        (columnaGrupos!.headerFilterParams as any).values = listaGrupos.map((grupo: { nombre: string }) => grupo.nombre);
        (columnaGrupos!.headerFilterFunc as any) = (headerValue: any, rowValue: any, rowData: any, filterParams: any) => { return headerValue.some((valor: string) => rowValue.includes(valor)) };
        delete (columnaGrupos!.headerFilterParams! as any).valuesLookup;


        if (this.componenteTabla?.tabla) {
          this.componenteTabla.sustituirDatos(this._utils.convertirEnFormatoTabla(filas))
        } else {
          this.datosTabla = {
            cabecera,
            tableData: this._utils.convertirEnFormatoTabla(filas),
            options: {
              title: 'Lista de Artículos',
              height: '500px',
              layout: 'fitDataStretch',
              actionBar: { config: true, download: true, upload: false }
            },
            styles: { theme: 'dark' }
          }
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
      if (respuesta.error === 'supabase') {
        this._snackbar.open(`Ha habido un error al añadir los artículos.`, undefined, { duration: 7000 });
      } else {
        this.errorExcel = { data: respuesta.data!, field: respuesta.errorField!, message: respuesta.showError! }
        this._dialog.open(this.dialogErrorExcel);
      }
    }

    this.cargarTablaArticulos();

    this.componenteTabla.visibilidadSpinner = false;
    this.inputArchivo.nativeElement.value = null;
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

      case 'tableBuilt':
        this.componenteTabla.tabla.setHeaderFilterValue('activo', true as any);
        break;

      case 'filtersCleared':
        this.componenteTabla.tabla.setHeaderFilterValue('activo', true as any);
        break;
    }
  }

  eventosLoadingManager(evento: LoadingManagerEvent) {
    if (evento.type === 'reload') this.cargarTablaArticulos();
  }

  tratamientoFilas(filas: any) {

    filas.forEach((fila: any) => {

      //Códigos de barras
      let listaEans = [];
      if (fila.ean13_1) listaEans.push(fila.ean13_1);
      if (fila.ean13_2) listaEans.push(fila.ean13_2);
      if (fila.ean13_3) listaEans.push(fila.ean13_3);
      if (fila.ean13_4) listaEans.push(fila.ean13_4);
      if (fila.ean13_5) listaEans.push(fila.ean13_5);
      fila.ean13 = listaEans.join(', ');

      //Proveedor
      if (fila.proveedor !== null) fila.proveedor = fila.proveedores.nombre;
      delete fila.proveedores;

      //Familia
      if (fila.familia !== null) fila.familia = fila.familias.nombre;
      delete fila.familias;

      //Subfamilia
      if (fila.subfamilia !== null) fila.subfamilia = fila.subfamilias.nombre;
      delete fila.subfamilias;

      //IVA
      if (fila.iva !== null) fila.iva = fila.ivas.valor_iva;
      delete fila.ivas;

      //Marca
      if (fila.marca !== null) fila.marca = fila.marcas.nombre;
      delete fila.marcas;

      //Grupos
      fila.grupos = fila.articulos_grupos.map((grupo: any) => grupo.grupos_articulos.nombre).join(', ');
      delete fila.articulos_grupos;
    });

    return filas;
  }
}