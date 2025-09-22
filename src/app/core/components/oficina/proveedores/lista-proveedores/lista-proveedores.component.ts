import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RealtimeChannel } from '@supabase/supabase-js';
import { forkJoin, from, Observable, Subscription, tap } from 'rxjs';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { TabulatorService } from 'src/app/core/services/tabulator/tabulator.service';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';
import { UserLicojerez } from 'src/app/models/general';
import { ConfigTabla, Proveedor } from 'src/app/models/oficina';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { CellComponent } from 'tabulator-tables';
import { ElementoMenuContextual } from '../../main/main.component';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';

@Component({
  selector: 'app-lista-proveedores',
  templateUrl: './lista-proveedores.component.html',
  styleUrls: ['./lista-proveedores.component.scss']
})
export class ListaProveedoresComponent {
  public datosTabla: DataTablaTabulator;
  public cargaTablaProveedores: number = 0;
  @ViewChild('componenteTabla') componenteTabla: TablaTabulatorComponent;
  public user: UserLicojerez;
  public subContextual: Subscription;
  @Output() abrirFicha = new EventEmitter<number>();
  private suscripcionListaProveedores: RealtimeChannel;
  private listaProveedores: Proveedor[];

  constructor(private _supabase: SupabaseService, private _utils: UtilsService, private _tabulator: TabulatorService, private _dialog: MatDialog) { }

  async ngOnInit() {
    this.user = await this._supabase.getUser();
    this.cargarTablaProveedores();

    this.subContextual = this._utils.eventoMenuContextual.subscribe(res => {
      if (res.type === 'click') {
        this.opcionesMenuContextual(res.opcion)
      }
    })
  }

  cargarTablaProveedores() {
    this.cargaTablaProveedores = 0;

    const incrementarCarga = () => {
      if (this.cargaTablaProveedores !== -1) {
        this.cargaTablaProveedores += 100 / 2;
      }
    }

    forkJoin([
      (from(this._supabase.supabase.from('proveedores').select(`*`).order('nombre')) as Observable<{ data: Proveedor[] }>).pipe(tap(() => incrementarCarga())),
      (from(this._supabase.supabase.from('config_componentes').select('*').eq('viewname', 'tabla-lista-proveedores').eq('user', this.user.username).single()) as Observable<{ data: ConfigTabla }>).pipe(tap(() => incrementarCarga()))
    ]).subscribe({
      next: async ([{ data: filas }, { data: configUsuario }]) => {

        filas = this.tratamientoFilas(filas);

        this.listaProveedores = filas;

        if (this.componenteTabla?.tabla) {
          this.componenteTabla.sustituirDatos(this._utils.convertirEnFormatoTabla(filas))
        } else {
          this.datosTabla = {
            cabecera: this._tabulator.getHeaderTablaProveedores(),
            tableData: this._utils.convertirEnFormatoTabla(filas),
            config: await this._tabulator.tratamientoConfigTabla(this._tabulator.getHeaderTablaProveedores(), 'tabla-lista-proveedores', configUsuario ? configUsuario.config : []),
            options: {
              title: 'Lista de Proveedores',
              height: '500px',
              movableColumns: true,
              layout: 'fitDataStretch',
              actionBar: { config: true, download: true },
              index: 'id_proveedor'
            },
            styles: { theme: 'dark' }
          }

          this.iniciarSocketListaProveedores();
        }
      },
      error: (err) => { this.cargaTablaProveedores = -1; }
    });
  }

  async recibirEventosTabulator(evento: TablaTabulatorEvent) {

    switch (evento.action) {
      case 'columnMoved':
      case 'columnResized':
      case 'configChanged':
        await this._supabase.supabase.from('config_componentes').update({ config: evento.value }).eq('viewname', 'tabla-lista-proveedores').eq('user', this.user.username);
        break;

      case 'cellContext':
        this._utils.abrirMenuContextual(evento.value.event, [{ title: 'Abrir ficha del proveedor', field: 'abrir-ficha', value: (evento.value.celda as CellComponent).getRow().getData()['id_proveedor'] }], { x: evento.value.event.clientX, y: evento.value.event.clientY }, (evento.value.celda as CellComponent).getValue())
        break;

      case 'cellDblClick':
        this.abrirFicha.emit((evento.value as CellComponent).getRow().getData()['id_proveedor']);
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
    if (evento.type === 'reload') this.cargarTablaProveedores();
  }

  tratamientoFilas(filas: Proveedor[]) {

    filas.forEach(fila => {
      fila.activo = fila.activo ? 'Sí' : 'No' as any;
    });

    return filas;
  }

  iniciarSocketListaProveedores() {

    const proveedorIndexMap = new Map<string, number>();

    this.listaProveedores.forEach((art, i) => {
      proveedorIndexMap.set(String(art.id_proveedor), i);
    });

    let codigosPendientes = new Set<string>();
    let timeoutActualizar: any = null;

    this.suscripcionListaProveedores = this._supabase.supabase.channel('proveedores').on('postgres_changes', { event: '*', schema: 'public', table: 'proveedores' }, (payload) => {

      switch (payload.eventType) {
        case 'INSERT':
          this.componenteTabla.tabla.addData([payload.new]);
          codigosPendientes.add(payload.new['id_proveedor']);
          break;

        case 'UPDATE':
          this.componenteTabla.tabla.updateData([payload.new]);
          codigosPendientes.add(payload.new['id_proveedor']);
          break;

        case 'DELETE':
          this.componenteTabla.tabla.deleteRow(payload.old['id_proveedor']);

          const index = proveedorIndexMap.get(payload.old['id_proveedor']);
          if (index !== undefined) {
            this.listaProveedores.splice(index, 1);
            proveedorIndexMap.delete(payload.old['id_proveedor']);
          }
          break;
      }

      this.componenteTabla.tabla.setData(this.tratamientoFilas(this.componenteTabla.tabla.getData()))

      if (timeoutActualizar) clearTimeout(timeoutActualizar);
      timeoutActualizar = setTimeout(async () => {
        if (codigosPendientes.size === 0) return;

        const codigos = Array.from(codigosPendientes);
        codigosPendientes.clear();

        const { data, error } = await this._supabase.supabase.from('proveedores').select(`*`).in('id_proveedor', codigos);

        if (error) return;

        data.forEach((proveedor: Proveedor) => {
          const index = proveedorIndexMap.get(String(proveedor.id_proveedor));
          if (index !== undefined) {
            this.listaProveedores[index] = proveedor;
          } else {
            this.listaProveedores.push(proveedor);
            proveedorIndexMap.set(String(proveedor.id_proveedor), this.listaProveedores.length - 1);
          }
        });

      }, 150);
    }).subscribe();
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionListaProveedores);
  }
}