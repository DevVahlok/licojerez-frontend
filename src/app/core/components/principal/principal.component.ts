import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase/supabase.service';

interface OpcionMenu {
  icono: string,
  titulo: string,
  redirect: string
}

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss']
})
export class PrincipalComponent {

  public listaOpciones: OpcionMenu[] = [];
  public user: any;

  constructor(private _title: Title, private _router: Router, private _supabase: SupabaseService) { }

  async ngOnInit() {
    this._title.setTitle('Menú principal');
    this.user = await this._supabase.getUser();
    this.conseguirOpcionesMenu();
  }

  conseguirOpcionesMenu() {
    this.listaOpciones = [
      // { titulo: 'TPV', icono: 'shopping_cart', redirect: '' },
      { titulo: 'Oficina', icono: 'business_center', redirect: '/oficina/articulos' }
    ]
  }

  redirigirPantalla(ruta: string) {
    if (ruta !== '') this._router.navigate([ruta]);
  }

  cerrarSesion() {
    this._supabase.signOut();
    this._router.navigate(['/login']);
  }
}