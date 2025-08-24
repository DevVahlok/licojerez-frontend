import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Etiqueta } from 'src/app/models/oficina';

@Injectable({
  providedIn: 'root'
})
export class EtiquetasService {

  private colaEtiquetas = new BehaviorSubject<Etiqueta[]>([]);
  etiquetas$ = this.colaEtiquetas.asObservable();

  constructor() { }

  anadirEtiqueta(etiqueta: Etiqueta) {
    const currentItems = this.colaEtiquetas.value;
    this.colaEtiquetas.next([...currentItems, etiqueta]);
  }
}