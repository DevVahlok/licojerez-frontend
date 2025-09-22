import { Component } from '@angular/core';
import { Centro } from 'src/app/models/oficina';

@Component({
  selector: 'app-ficha-cliente',
  templateUrl: './ficha-cliente.component.html',
  styleUrls: ['./ficha-cliente.component.scss']
})
export class FichaClienteComponent {

  public listaCentros: Centro[] = [
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', zona: '' },
  ] //TODO: placeholder

}