import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { UserLicojerez } from 'src/app/models/general';
import { EtiquetasService } from 'src/app/core/services/etiquetas/etiquetas.service';
import { Etiqueta } from 'src/app/models/oficina';

interface OpcionMenuLateral {
  title: string,
  url: string,
  iconFont: string,
  icon: string,
}

export interface ElementoMenuContextual {
  title: string,
  field: string,
  value?: any,
  name?: string,
  expandible?: boolean,
  expandibleValues?: ElementoMenuContextual[],
  class?: string,
  badge?: string
}


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MainComponent {

  public user: UserLicojerez;
  public opcionesMenuLateral: OpcionMenuLateral[] = [
    { title: 'Artículos', icon: 'liquor', iconFont: 'material-symbols-outlined', url: '/oficina/articulos' },
    { title: 'Proveedores', icon: 'local_shipping', iconFont: 'material-symbols-outlined', url: '/oficina/proveedores' },
    { title: 'Logs', icon: 'checkbook', iconFont: 'material-symbols-outlined', url: '/oficina/logs' },
  ];
  public contextMenuPosition = { x: '0px', y: '0px' };
  public listaElementosContextual: ElementoMenuContextual[] = [];
  public subContextual: Subscription;
  @ViewChild('trigger') contextMenu: MatMenuTrigger;
  public colaEtiquetas: Etiqueta[] = [];

  constructor(public _router: Router, public _dialog: MatDialog, private _supabase: SupabaseService, private _utils: UtilsService, private _etiquetas: EtiquetasService) { }

  async ngOnInit() {
    this.user = await this._supabase.getUser();
    this.suscribirseMenuContextual();
    this.suscribirseColaEtiquetas();
  }

  cerrarSesion() {
    this._supabase.signOut();
    this._router.navigate(['/login']);
  }

  enviarEventoMenuContextual(opcion: ElementoMenuContextual, opcionPadre?: any, name?: string) {
    this._utils.clickOpcionMenuContextual(opcion, opcionPadre, name)
  }

  abrirMenuContextual(opciones: ElementoMenuContextual[], posicion: { x: number, y: number }, copiar?: any, name?: string) {
    if (opciones && opciones.length > 0) {
      this.listaElementosContextual = opciones;
      this.contextMenuPosition.x = `${posicion.x}px`;
      this.contextMenuPosition.y = `${posicion.y}px`;
      this.contextMenu.menuData = { 'item': copiar ? copiar : null, 'name': name }
      this.contextMenu.openMenu();
    }
  }

  suscribirseMenuContextual() {
    this.subContextual = this._utils.eventoMenuContextual.subscribe(res => {
      if (res.type === 'open') {
        this.abrirMenuContextual(res.options, res.position, res.copyElement, res.name);
      }
    })
  }

  suscribirseColaEtiquetas() {
    this._etiquetas.etiquetas$.subscribe(etiquetas => {
      this.colaEtiquetas = etiquetas;
    });
  }

  imprimirEtiquetas() {
    this._etiquetas.imprimirEtiquetas();
  }
}