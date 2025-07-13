import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase/supabase.service';

interface Usuario {
  name: string,
  user: string
}

interface OpcionMenuLateral {
  title: string,
  url: string,
  iconFont: string,
  icon: string,
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MainComponent {

  public user: any;
  public opcionesMenuLateral: OpcionMenuLateral[] = [
    { title: 'Artículos', icon: 'liquor', iconFont: 'material-symbols-outlined', url: '/oficina/articulos' },
    { title: 'Logs', icon: 'checkbook', iconFont: 'material-symbols-outlined', url: '/oficina/logs' },
  ]

  constructor(private _router: Router, public _dialog: MatDialog, private _supabase: SupabaseService) { }

  async ngOnInit() {
    this.user = await this._supabase.getUser();
  }

  abrirDialogMenuLateral() {

  }

  cerrarSesion() {
    this._supabase.signOut();
    this._router.navigate(['/login']);
  }
}