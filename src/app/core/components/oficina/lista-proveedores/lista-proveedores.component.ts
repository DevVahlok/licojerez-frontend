import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-lista-proveedores',
  templateUrl: './lista-proveedores.component.html',
  styleUrls: ['./lista-proveedores.component.scss']
})
export class ListaProveedoresComponent {

  constructor(private _title: Title) { }

  ngOnInit() {
    this._title.setTitle('Proveedores')
  }

}