import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface OpcionMenu {
  icono: string,
  titulo: string
}

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss']
})
export class PrincipalComponent {

  public listaOpciones: OpcionMenu[] = []

  constructor(private _title: Title, private _router: Router) { }

  ngOnInit() {
    this._title.setTitle('Menú principal');

    this.conseguirOpcionesMenu();
  }

  conseguirOpcionesMenu() {
    this.listaOpciones = [
      { titulo: 'TPV', icono: 'shopping_cart' },
      { titulo: 'Oficina', icono: 'business_center' }
    ]
  }

  cerrarSesion() {
    this._router.navigate(['/login']);
    //TODO: borrar usuarios y cookies
  }

  //TODO: añadir inclusivo al 'bienvenid@'
  //TODO: aplicar nombre de usuario arriba a la derecha
}