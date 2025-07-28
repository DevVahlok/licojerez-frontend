import { Component, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';

interface LogInterno {
  id: number,
  fecha: string,
  usuario: string,
  accion: string,
  detalles: string
}

@Component({
  selector: 'app-lista-logs',
  templateUrl: './lista-logs.component.html',
  styleUrls: ['./lista-logs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListaLogsComponent {

  public listaLogs: LogInterno[];
  public moment = moment;
  @ViewChild('dialogDetalleLog') dialogDetalleLog: TemplateRef<null>;
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  public detalleLog: string = '';
  public spinner: 1 | 0 | -1 = 0;

  constructor(private _title: Title, private _supabase: SupabaseService, public _dialog: MatDialog, private _utils: UtilsService) { }

  ngOnInit() {
    this._title.setTitle('Logs');
    this.cargarListaLogs();
  }

  async cargarListaLogs() {
    this.spinner = 0;
    const { data, error } = await this._supabase.supabase.from('logs').select('*');

    if (error) {
      this.spinner = -1;
    }

    if (data) {
      this.spinner = 1;
      this.listaLogs = data;
      await this._utils.delay(10);
      this.viewport.scrollToIndex(this.listaLogs.length - 1, 'auto');
    }
  }

  abrirPopupDetalles(texto: string) {
    this.detalleLog = texto;
    this._dialog.open(this.dialogDetalleLog);
  }
}