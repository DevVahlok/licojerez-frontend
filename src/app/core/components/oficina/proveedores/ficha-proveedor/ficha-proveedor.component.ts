import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ficha-proveedor',
  templateUrl: './ficha-proveedor.component.html',
  styleUrls: ['./ficha-proveedor.component.scss']
})
export class FichaProveedorComponent {
  @Input() id: number;
  @Input() indexTabs: number;
  @Output() cambiarTab = new EventEmitter<number>();
}
