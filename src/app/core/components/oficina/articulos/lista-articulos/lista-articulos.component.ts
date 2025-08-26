import { Component, ElementRef, EventEmitter, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { SupabaseService } from '../../../../services/supabase/supabase.service';
import { UtilsService } from '../../../../services/utils-v2/utils.service';
import { Title } from '@angular/platform-browser';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';
import { forkJoin, from, Observable, Subscription, tap } from 'rxjs';
import { TabulatorService } from 'src/app/core/services/tabulator/tabulator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CellComponent, ColumnDefinition, EditorParams } from 'tabulator-tables';
import { Router } from '@angular/router';
import { ElementoMenuContextual } from '../../main/main.component';
import { UserLicojerez } from 'src/app/models/general';
import { Articulo, ConfigTabla, Etiqueta, IVA } from 'src/app/models/oficina';
import { DialogConfirmacion } from 'src/app/shared/dialogs/dialog-confirmacion/dialog-confirmacion';
import { ElementoDesplegable } from '../articulos.component';
import { EtiquetasService } from 'src/app/core/services/etiquetas/etiquetas.service';

type Override<T, R> = Omit<T, keyof R> & R;

interface ArticuloSupabase extends Override<Articulo, { activo: string, tiene_lote: string }> {
  proveedores: { nombre: string },
  familias: { nombre: string },
  subfamilias: { nombre: string },
  ivas: { valor_iva: number },
  marcas: { nombre: string },
  articulos_grupos: { grupos_articulos: { nombre: string } }[],
  ean13: string,
  proveedor?: string,
  familia?: string,
  subfamilia?: string,
  iva?: number,
  marca?: string,
  grupos?: string,
  activo: string,
  tiene_lote: string,
}

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
  @ViewChild('dialogErrorExcel') dialogErrorExcel: TemplateRef<null>;
  public errorExcel: { message: string, field: string, data: { nombre: string }[] };
  public user: UserLicojerez;
  public subContextual: Subscription;
  @Output() abrirFicha = new EventEmitter<number>();
  public listaIVAs: ElementoDesplegable[] = [];

  constructor(private _title: Title, private _supabase: SupabaseService, private _utils: UtilsService, private _tabulator: TabulatorService, private _snackbar: MatSnackBar, public _dialog: MatDialog, private _etiquetas: EtiquetasService) { }

  async ngOnInit() {
    this._title.setTitle('Artículos');
    this.user = await this._supabase.getUser();
    this.cargarTablaArticulos();
    this.cargarListaIVAs();

    this.subContextual = this._utils.eventoMenuContextual.subscribe(res => {
      if (res.type === 'click') {
        this.opcionesMenuContextual(res.opcion)
      }
    })
  }

  async cargarListaIVAs() {
    const { data, error } = await this._supabase.supabase.from<any, IVA[]>('ivas').select('*');
    if (!error) {
      this.listaIVAs = data?.map(iva => { return { codigo: iva.id_iva, nombre: iva.valor_iva }; });
    }
  }

  cargarTablaArticulos() {
    this.cargaTablaArticulos = 0;

    const incrementarCarga = () => {
      if (this.cargaTablaArticulos !== -1) {
        this.cargaTablaArticulos += 100 / 3;
      }
    }

    forkJoin([
      (from(this._supabase.supabase.from('articulos').select(`*, proveedores(nombre), familias(nombre), subfamilias(nombre), ivas(valor_iva), marcas(nombre), articulos_grupos!articulos_grupos_id_articulo_fkey (id_articulo_grupo, grupos_articulos!articulos_grupos_id_grupo_fkey (id_grupo_articulo, nombre))`).order('nombre')) as Observable<{ data: ArticuloSupabase[] }>).pipe(tap(() => incrementarCarga())),
      (from(this._supabase.supabase.from('grupos_articulos').select('nombre').order('nombre')) as Observable<{ data: { nombre: string }[] }>).pipe(tap(() => incrementarCarga())),
      (from(this._supabase.supabase.from('config_componentes').select('*').eq('viewname', 'tabla-lista-articulos').eq('user', this.user.username).single()) as Observable<{ data: ConfigTabla }>).pipe(tap(() => incrementarCarga()))
    ]).subscribe({
      next: async ([{ data: filas }, { data: listaGrupos }, { data: configUsuario }]) => {

        filas = this.tratamientoFilas(filas);

        if (this.componenteTabla?.tabla) {
          this.componenteTabla.sustituirDatos(this._utils.convertirEnFormatoTabla(filas))
        } else {
          this.datosTabla = {
            cabecera: this.tratamientoColumnas(this._tabulator.getHeaderTablaArticulos(), listaGrupos),
            tableData: this._utils.convertirEnFormatoTabla(filas),
            config: await this._tabulator.tratamientoConfigTabla(this._tabulator.getHeaderTablaArticulos(), 'tabla-lista-articulos', configUsuario ? configUsuario.config : []),
            options: {
              title: 'Lista de Artículos',
              height: '500px',
              movableColumns: true,
              layout: 'fitDataStretch',
              actionBar: { config: true, download: true }
            },
            styles: { theme: 'dark' }
          }
        }
      },
      error: (err) => { this.cargaTablaArticulos = -1; }
    });
  }

  async onFileChange(evento: Event) {

    this.componenteTabla.visibilidadSpinner = true;

    const respuesta = await this._supabase.subirExcelTablaArticulos((evento.target as HTMLInputElement).files![0]);

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

  async recibirEventosTabulator(evento: TablaTabulatorEvent) {

    switch (evento.action) {
      case 'columnMoved':
      case 'columnResized':
      case 'configChanged':
        await this._supabase.supabase.from('config_componentes').update({ config: evento.value }).eq('viewname', 'tabla-lista-articulos').eq('user', this.user.username);
        break;

      case 'cellContext':
        this._utils.abrirMenuContextual(evento.value.event, [{ title: 'Abrir ficha del artículo', field: 'abrir-ficha', value: (evento.value.celda as CellComponent).getRow().getData()['codigo'] }], { x: evento.value.event.clientX, y: evento.value.event.clientY }, (evento.value.celda as CellComponent).getValue())
        break;

      case 'cellDblClick':
        this.abrirFicha.emit((evento.value as CellComponent).getRow().getData()['id_articulo']);
        break;

      case 'dataFiltered':
        if (this.componenteTabla.tabla.getFilters(true).find(col => col.field === 'grupos')?.value.length === 0) {
          await this._utils.delay(5);
          this.componenteTabla.tabla.getColumn('grupos').setHeaderFilterValue('')
        }
        break;
    }
  }

  opcionesMenuContextual(opcion: ElementoMenuContextual) {
    switch (opcion.field) {
      case 'abrir-ficha':
        this.abrirFicha.emit(opcion.value);
        break;
    }
  }

  eventosLoadingManager(evento: LoadingManagerEvent) {
    if (evento.type === 'reload') this.cargarTablaArticulos();
  }

  tratamientoFilas(filas: ArticuloSupabase[]) {

    filas.forEach(fila => {

      //Códigos de barras
      let listaEans = [];
      if (fila.ean13_1) listaEans.push(fila.ean13_1);
      if (fila.ean13_2) listaEans.push(fila.ean13_2);
      if (fila.ean13_3) listaEans.push(fila.ean13_3);
      if (fila.ean13_4) listaEans.push(fila.ean13_4);
      if (fila.ean13_5) listaEans.push(fila.ean13_5);
      fila.ean13 = listaEans.join(', ');

      //Proveedor
      if (fila.id_proveedor !== null) fila.proveedor = fila.proveedores?.nombre;

      //Familia
      if (fila.id_familia !== null) fila.familia = fila.familias?.nombre;

      //Subfamilia
      if (fila.id_subfamilia !== null) fila.subfamilia = fila.subfamilias?.nombre;

      //IVA
      if (fila.id_iva !== null) fila.iva = fila.ivas?.valor_iva;

      //Marca
      if (fila.id_marca !== null) fila.marca = fila.marcas?.nombre;

      //Grupos
      fila.grupos = fila.articulos_grupos.map(grupo => grupo.grupos_articulos.nombre).join(', ');

      //Activo
      fila.activo = fila.activo ? 'Sí' : 'No';

      //Tiene Lote
      fila.tiene_lote = fila.tiene_lote ? 'Sí' : 'No';
    });

    return filas;
  }

  tratamientoColumnas(cabecera: ColumnDefinition[], listaGrupos: { nombre: string }[]) {
    let columnaGrupos = cabecera.find(col => col.field === 'grupos');
    (columnaGrupos!.headerFilterParams! as EditorParams & { values: string[] }).values = listaGrupos.map((grupo: { nombre: string }) => grupo.nombre);
    columnaGrupos!.headerFilterFunc = (headerValue, rowValue, rowData, filterParams) => { return headerValue.some((valor: string) => rowValue.includes(valor)) };
    delete (columnaGrupos!.headerFilterParams! as EditorParams & { valuesLookup?: string }).valuesLookup;

    return cabecera;
  }

  imprimirTodasLasEtiquetas() {

    const listaEtiquetas = this.componenteTabla.tabla.getRows('all').filter(celda => celda.getData()['activo'] === 'Sí').map(celda => {
      const articulo = celda.getData();
      return { id_articulo: articulo['id_articulo'], nombre: articulo['nombre'], precio_final: articulo['precio_venta'], precio_sin_iva: Math.round(articulo['precio_venta'] / (1 + Number(this.listaIVAs?.find(iva => Number(iva.codigo) === articulo['id_iva'])?.nombre) / 100) * 100) / 100 }
    });

    this._dialog.open(DialogConfirmacion, {
      width: '400px',
      data: { message: `¿Quieres imprimir ${listaEtiquetas.length} etiquetas? Ocuparán ${Math.ceil(listaEtiquetas.length / 15)} folios.` }
    }).afterClosed().subscribe(async (res) => {
      if (res) this._etiquetas.imprimirEtiquetas(listaEtiquetas);
    });
  }
}