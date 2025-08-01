import { Component, ViewEncapsulation } from '@angular/core';
import { FichaArticuloComponent } from '../ficha-articulo.component';
import moment from 'moment';
import { Articulo } from 'src/app/models/oficina';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-editar-articulo',
  templateUrl: './editar-articulo.component.html',
  styleUrls: ['./editar-articulo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditarArticuloComponent extends FichaArticuloComponent {

  public spinner: boolean = false;
  private timer: NodeJS.Timeout;
  private suscripcionArticulo: RealtimeChannel;

  override ngOnInit(): void {
    this.spinner = true;
  }

  override async onIdCambiada(valor: number): Promise<void> {
    await this.conseguirArticulo();
  }

  async conseguirArticulo() {

    //TODO: aplicar sockets a cada desplegable (cada vez que se crea una subfamilia, por ejemplo)

    //TODO: añadir buscadores a los desplegables

    //TODO: remaquetar apartado tarifas

    //TODO: añadir formatter € en los campos

    this.suscripcionArticulo = this._supabase.supabase.channel(`articulo-${this.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articulos', filter: `codigo=eq.${this.id}` }, payload => {
        console.log(payload);
        this.articulo = payload.new as Articulo;
        this.formArticulo.setValue(this.tratamientoPreFormulario())
      }).subscribe();

    const { data, error } = await this._supabase.supabase.from('articulos').select('*').eq('codigo', this.id).single();

    if (error) {
      //TODO: mostrar error
      return;
    }

    console.log(data);

    this.articulo = data;
    this.spinner = false;

    this.formArticulo.setValue(this.tratamientoPreFormulario())
  }

  tratamientoPreFormulario() {

    this.formArticulo.get('codigo')?.disable();
    this.formArticulo.get('fecha_alta')?.disable();

    return {
      codigo: this.articulo.codigo,
      fecha_alta: moment(this.articulo.fecha_alta).format('DD/MM/yyyy'),
      nombre: this.articulo.nombre,
      ean13_1: this.articulo.ean13_1,
      ean13_2: this.articulo.ean13_2,
      ean13_3: this.articulo.ean13_3,
      ean13_4: this.articulo.ean13_4,
      ean13_5: this.articulo.ean13_5,
      stock: this.articulo.stock,
      precio_coste: this.articulo.precio_coste,
      tipo: this.articulo.tipo,
      precio_venta: this.articulo.precio_venta,
      idProveedor: this.articulo.idProveedor,
      idFamilia: this.articulo.idFamilia,
      idSubfamilia: this.articulo.idSubfamilia,
      idIva: this.articulo.idIva,
      margen: this.articulo.margen,
      activo: this.articulo.activo,
      comision_default: this.articulo.comision_default,
      tiene_lote: this.articulo.tiene_lote,
      idMarca: this.articulo.idMarca
    }
  }

  editarCampo<K extends keyof Articulo>(campo: K) {

    const camposSinDelay = ['activo', 'tiene_lote', 'tipo']

    clearTimeout(this.timer);

    if (this.formArticulo.get(campo)?.valid) {
      this.timer = setTimeout(async () => {

        if (this.formArticulo.get(campo)!.value === '') this.formArticulo.get(campo)!.setValue(null as any);

        const { error } = await this._supabase.supabase.from('articulos').update({ [campo]: this.formArticulo.get(campo)!.value }).eq('codigo', this.id)
        //TODO: logs
        if (error) {
          this._snackbar.open(`Ha habido un error al modificar el campo: ${campo}`, undefined, { duration: 7000 });
        } else {
          this.articulo[campo] = this.formArticulo.get(campo)!.value as Articulo[K];
        }

      }, (camposSinDelay.includes(campo) ? 0 : 500));
    }
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionArticulo);
  }
}