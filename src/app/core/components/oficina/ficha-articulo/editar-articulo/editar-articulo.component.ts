import { Component, ViewEncapsulation } from '@angular/core';
import { FichaArticuloComponent } from '../ficha-articulo.component';

@Component({
  selector: 'app-editar-articulo',
  templateUrl: './editar-articulo.component.html',
  styleUrls: ['./editar-articulo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditarArticuloComponent extends FichaArticuloComponent {

  public spinner: boolean = false;

  override ngOnInit(): void {
    this.spinner = true;
  }

  override async onIdCambiada(valor: number): Promise<void> {
    await this.conseguirArticulo();
  }

  async conseguirArticulo() {
    const { data, error } = await this._supabase.supabase.from('articulos').select('*').eq('codigo', this.id).single();

    if (error) {
      //TODO: mostrar error
      return;
    }

    this.articulo = data;
    this.spinner = false;




    this.formArticulo.get('codigo')?.setValue(this.id);




    this.formArticulo.get('codigo')?.disable();
  }

}