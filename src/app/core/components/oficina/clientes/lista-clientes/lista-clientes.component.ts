import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subscription, forkJoin, from, Observable, tap } from 'rxjs';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { TabulatorService } from 'src/app/core/services/tabulator/tabulator.service';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';
import { UserLicojerez } from 'src/app/models/general';
import { Cliente, ConfigTabla } from 'src/app/models/oficina';
import { DataTablaTabulator, TablaTabulatorComponent, TablaTabulatorEvent } from 'src/app/shared/components/tabla-tabulator/tabla-tabulator.component';
import { LoadingManagerEvent } from 'src/app/shared/layers/component-loading-manager/component-loading-manager.component';
import { CellComponent } from 'tabulator-tables';
import { ElementoMenuContextual } from '../../main/main.component';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.scss']
})
export class ListaClientesComponent {
  public datosTabla: DataTablaTabulator;
  public cargaTablaClientes: number = 0;
  @ViewChild('componenteTabla') componenteTabla: TablaTabulatorComponent;
  public user: UserLicojerez;
  public subContextual: Subscription;
  @Output() abrirFicha = new EventEmitter<number>();
  private suscripcionListaClientes: RealtimeChannel;
  private listaClientes: Cliente[];

  constructor(private _supabase: SupabaseService, private _utils: UtilsService, private _tabulator: TabulatorService, private _dialog: MatDialog) { }

  async ngOnInit() {
    this.user = await this._supabase.getUser();
    this.cargarTablaClientes();

    this.subContextual = this._utils.eventoMenuContextual.subscribe(res => {
      if (res.type === 'click') {
        this.opcionesMenuContextual(res.opcion)
      }
    })
  }

  cargarTablaClientes() {
    this.cargaTablaClientes = 0;

    const incrementarCarga = () => {
      if (this.cargaTablaClientes !== -1) {
        this.cargaTablaClientes += 100 / 2; //TODO: añadir +1 al poner la llamada de los centros
      }
    }

    forkJoin([
      (from(this._supabase.supabase.from('clientes').select(`*`).order('nombre')) as Observable<{ data: Cliente[] }>).pipe(tap(() => incrementarCarga())),
      (from(this._supabase.supabase.from('config_componentes').select('*').eq('viewname', 'tabla-lista-clientes').eq('user', this.user.username).single()) as Observable<{ data: ConfigTabla }>).pipe(tap(() => incrementarCarga()))
    ]).subscribe({
      next: async ([{ data: filas }, { data: configUsuario }]) => {

        filas = this.tratamientoFilas(filas);

        this.listaClientes = filas;

        if (this.componenteTabla?.tabla) {
          this.componenteTabla.sustituirDatos(this._utils.convertirEnFormatoTabla(filas))
        } else {
          this.datosTabla = {
            cabecera: this._tabulator.getHeaderTablaClientes(),
            tableData: this._utils.convertirEnFormatoTabla(filas),
            config: await this._tabulator.tratamientoConfigTabla(this._tabulator.getHeaderTablaClientes(), 'tabla-lista-clientes', configUsuario ? configUsuario.config : []),
            options: {
              title: 'Lista de Clientes',
              height: '500px',
              movableColumns: true,
              layout: 'fitDataStretch',
              actionBar: { config: true, download: true },
              index: 'id_cliente'
            },
            styles: { theme: 'dark' }
          }

          this.iniciarSocketListaClientes();
        }
      },
      error: (err) => { this.cargaTablaClientes = -1; }
    });
  }

  async recibirEventosTabulator(evento: TablaTabulatorEvent) {

    switch (evento.action) {
      case 'columnMoved':
      case 'columnResized':
      case 'configChanged':
        await this._supabase.supabase.from('config_componentes').update({ config: evento.value }).eq('viewname', 'tabla-lista-clientes').eq('user', this.user.username);
        break;

      case 'cellContext':
        this._utils.abrirMenuContextual(evento.value.event, [{ title: 'Abrir ficha del cliente', field: 'abrir-ficha', value: (evento.value.celda as CellComponent).getRow().getData()['id_cliente'] }], { x: evento.value.event.clientX, y: evento.value.event.clientY }, (evento.value.celda as CellComponent).getValue())
        break;

      case 'cellDblClick':
        this.abrirFicha.emit((evento.value as CellComponent).getRow().getData()['id_cliente']);
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
    if (evento.type === 'reload') this.cargarTablaClientes();
  }

  tratamientoFilas(filas: Cliente[]) {

    filas.forEach(fila => {
      fila.activo = fila.activo ? 'Sí' : 'No' as any;
    });

    return filas;
  }

  iniciarSocketListaClientes() {

    const clienteIndexMap = new Map<string, number>();

    this.listaClientes.forEach((art, i) => {
      clienteIndexMap.set(String(art.id_cliente), i);
    });

    let codigosPendientes = new Set<string>();
    let timeoutActualizar: any = null;

    this.suscripcionListaClientes = this._supabase.supabase.channel('clientes').on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {

      switch (payload.eventType) {
        case 'INSERT':
          this.componenteTabla.tabla.addData([payload.new]);
          codigosPendientes.add(payload.new['id_cliente']);
          break;

        case 'UPDATE':
          this.componenteTabla.tabla.updateData([payload.new]);
          codigosPendientes.add(payload.new['id_cliente']);
          break;

        case 'DELETE':
          this.componenteTabla.tabla.deleteRow(payload.old['id_cliente']);

          const index = clienteIndexMap.get(payload.old['id_cliente']);
          if (index !== undefined) {
            this.listaClientes.splice(index, 1);
            clienteIndexMap.delete(payload.old['id_cliente']);
          }
          break;
      }

      this.componenteTabla.tabla.setData(this.tratamientoFilas(this.componenteTabla.tabla.getData()))

      if (timeoutActualizar) clearTimeout(timeoutActualizar);
      timeoutActualizar = setTimeout(async () => {
        if (codigosPendientes.size === 0) return;

        const codigos = Array.from(codigosPendientes);
        codigosPendientes.clear();

        const { data, error } = await this._supabase.supabase.from('clientes').select(`*`).in('id_cliente', codigos);

        if (error) return;

        data.forEach((cliente: Cliente) => {
          const index = clienteIndexMap.get(String(cliente.id_cliente));
          if (index !== undefined) {
            this.listaClientes[index] = cliente;
          } else {
            this.listaClientes.push(cliente);
            clienteIndexMap.set(String(cliente.id_cliente), this.listaClientes.length - 1);
          }
        });

      }, 150);
    }).subscribe();
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionListaClientes);
  }
}