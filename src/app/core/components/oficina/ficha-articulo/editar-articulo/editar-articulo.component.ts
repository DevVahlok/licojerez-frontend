import { Component, ViewEncapsulation } from '@angular/core';
import { FichaArticuloComponent, ListaDesplegablesFichaArticulo } from '../ficha-articulo.component';
import { Articulo } from 'src/app/models/oficina';
import { RealtimeChannel } from '@supabase/supabase-js';
import { FormControl, FormGroup } from '@angular/forms';
import moment from 'moment';

interface opcionBuscadorArticulo {
  codigo: number,
  nombre: string,
  ean13: string[]
}

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
  private valoresAnteriores: Articulo;
  public formFiltrosDesplegables = new FormGroup({
    proveedor: new FormControl(null),
    familia: new FormControl(null),
    subfamilia: new FormControl(null),
    marca: new FormControl(null),
    formato: new FormControl(null),
  });
  public listasFiltradasDesplegables: ListaDesplegablesFichaArticulo = {
    proveedor: [],
    familia: [],
    subfamilia: [],
    iva: [],
    marca: [],
  }
  public buscadorArticulo = new FormControl('');
  public opcionesBuscadorArticulos: opcionBuscadorArticulo[] = [];
  public opcionesBuscadorArticulosFiltrado: opcionBuscadorArticulo[] = [];
  public listaVendedores: any = [];
  public listaVendedoresFiltrada: any = [];
  public inputVendedor = new FormControl('');

  override async ngOnInit(): Promise<void> {
    this.spinner = true;
    this.conseguirVendedores();

    this.buscadorArticulo.valueChanges.subscribe(async value => {
      clearTimeout(this.timer);

      if (!value) value = '';
      value = value.replace(/,/g, ' ');

      this.timer = setTimeout(async () => {

        if (value === '') {
          this.opcionesBuscadorArticulosFiltrado = [];
        } else {
          const { data } = await this._supabase.supabase.from('articulos_busqueda').select('*').or(`nombre.ilike.%${value}%,` + `codigo.ilike.%${value}%,` + `ean13_1.ilike.%${value}%,` + `ean13_2.ilike.%${value}%,` + `ean13_3.ilike.%${value}%,` + `ean13_4.ilike.%${value}%,` + `ean13_5.ilike.%${value}%`);

          let resultado = data!?.map(articulo => { return { codigo: articulo.codigo, nombre: articulo.nombre, ean13: [articulo.ean13_1, articulo.ean13_2, articulo.ean13_3, articulo.ean13_4, articulo.ean13_5] } });

          const indexCodigoIdentico = resultado.findIndex(articulo => articulo.codigo === value);

          if (indexCodigoIdentico <= 0 || indexCodigoIdentico >= resultado.length) {

          } else {
            const elemento = resultado.splice(indexCodigoIdentico, 1)[0];
            resultado.unshift(elemento);
          }

          this.opcionesBuscadorArticulosFiltrado = resultado;
        }

      }, 200);

    });
  }

  seleccionarPrimero() {
    const opciones = this.opcionesBuscadorArticulosFiltrado;
    if (opciones.length > 0) this.redigirOtroArticulo(opciones[0].codigo)
  }

  redigirOtroArticulo(codigo: number) {
    this._router.navigateByUrl('/principal', { skipLocationChange: true }).then(() => {
      this._router.navigate([`/oficina/articulo/${codigo}`]);
    });
  }

  conseguirVendedores() {
    this.listaVendedores = [
      { codigo: 1, nombre: 'Carlos Medrano', comision: 5 },
      { codigo: 2, nombre: 'David Valderrama', comision: 7 },
      { codigo: 3, nombre: 'David Sainz', comision: 3 },
      { codigo: 4, nombre: 'Tomás Moreno', comision: 2 },
    ]

    this.listaVendedoresFiltrada = JSON.parse(JSON.stringify(this.listaVendedores))
  }

  filtrarVendedores() {
    //TODO: refactorizar vendedores hardcoded
    this.listaVendedoresFiltrada = this.listaVendedores.filter((vendedor: any) => vendedor.nombre.toLowerCase().includes(this.inputVendedor.value!.toLowerCase()))

  }

  override async onIdCambiada(valor: number): Promise<void> {
    await this.conseguirArticulo();
  }

  override onListasDesplegablesCambiada(valor: ListaDesplegablesFichaArticulo) {
    if (valor.proveedor) this.filtrarDesplegableSearch('proveedor');
    if (valor.familia) this.filtrarDesplegableSearch('familia');
    if (valor.subfamilia) this.filtrarDesplegableSearch('subfamilia');
    if (valor.marca) this.filtrarDesplegableSearch('marca');
  }

  filtrarDesplegableSearch(campo: 'proveedor' | 'familia' | 'subfamilia' | 'marca') {
    this.listasFiltradasDesplegables[campo] = this.listasDesplegables[campo];
    this.formFiltrosDesplegables.get(campo)!.valueChanges.pipe().subscribe(() => {
      if (!this.formFiltrosDesplegables.get(campo)!.value || this.formFiltrosDesplegables.get(campo)!.value === '') {
        this.listasFiltradasDesplegables[campo] = this.listasDesplegables[campo];
      } else {
        this.listasFiltradasDesplegables[campo] = this.listasDesplegables[campo]!?.filter(prov => prov.nombre.toLowerCase().includes((this.formFiltrosDesplegables.get(campo)!.value! as string).toLowerCase()));
      }
    });
  }

  async conseguirArticulo() {

    //TODO: aplicar sockets a cada desplegable (cada vez que se crea una subfamilia, por ejemplo), también en lista vendedores

    //TODO: poder ordenar lista vendedores por % comisión

    //TODO: añadir campo Formato

    //TODO: relacionar jerarquicamente familias con subfamilias, bloquear subfamilia si no tiene familia seleccionada

    //TODO: estilizar con placeholders la lisa de comisiones con sus vendedores

    this.suscripcionArticulo = this._supabase.supabase.channel(`articulo-${this.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'articulos', filter: `codigo=eq.${this.id}` }, payload => {
      this.articulo = payload.new as Articulo;
      this.formArticulo.setValue(this.tratamientoPreFormulario())
    }).subscribe();

    const { data, error } = await this._supabase.supabase.from('articulos').select('*').eq('codigo', this.id).single();

    if (error) {
      //TODO: mostrar error
      return;
    }

    this.articulo = data;
    this.spinner = false;

    this.formArticulo.setValue(this.tratamientoPreFormulario())
    this.valoresAnteriores = this.tratamientoPreFormulario();
  }

  tratamientoPreFormulario() {

    this.formArticulo.get('codigo')?.disable();
    this.formArticulo.get('fecha_alta')?.disable();
    this.formArticulo.get('precio_coste')?.disable();

    if (Number(this.formArticulo.get('stock')!.value) === 0) {
      this.formArticulo.get('tiene_lote')!.enable();
    } else {
      this.formArticulo.get('tiene_lote')!.disable();
    }

    if (this.formArticulo.get('tipo')!.value === 'Servicio') {
      this.formArticulo.get('stock')!.disable();
      this.formArticulo.get('tiene_lote')!.disable();
    }

    this.formArticulo.get('formato')!.disable();

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
      idMarca: this.articulo.idMarca,
      formato: null
    }
  }

  editarCampo<K extends keyof Articulo>(campo: K) {

    const camposSinDelay = ['activo', 'tiene_lote', 'tipo']

    clearTimeout(this.timer);

    if (this.formArticulo.get(campo)?.valid) {
      this.timer = setTimeout(async () => {

        if (this.formArticulo.get(campo)!.value === '') this.formArticulo.get(campo)!.setValue(null as any);

        const { error } = await this._supabase.supabase.from('articulos').update({ [campo]: this.formArticulo.get(campo)!.value }).eq('codigo', this.id)

        if (error) {
          this._snackbar.open(`Ha habido un error al modificar el campo: ${campo}`, undefined, { duration: 7000 });
          this._supabase.anadirLog(`ha tenido un error al modificar el campo "${campo}" del artículo con código ${this.id}`, error.message);
        } else {
          this.articulo[campo] = this.formArticulo.get(campo)!.value as Articulo[K];
          this._supabase.anadirLog(`ha modificado el campo "${campo}": ${this.valoresAnteriores[campo]} \u2192 ${this.formArticulo.get(campo)!.value} del artículo con código ${this.id}`);
          this.valoresAnteriores[campo] = this.formArticulo.get(campo)!.value;

          if (campo === 'stock') {
            if (Number(this.formArticulo.get(campo)!.value) === 0) {
              this.formArticulo.get('tiene_lote')!.enable();
            } else {
              this.formArticulo.get('tiene_lote')!.disable();
            }
          }

          const precio_venta = Number(this.formArticulo.get('precio_venta')!.value);
          const precio_coste = Number(this.formArticulo.get('precio_coste')!.value);
          const margen = Number(this.formArticulo.get('margen')!.value);

          switch (campo) {

            case 'tipo':

              if (this.formArticulo.get('tipo')!.value === 'Servicio') {
                this.formArticulo.get('stock')!.setValue(0)
                this.articulo.stock = 0;
                this.formArticulo.get('stock')!.disable();
                this.formArticulo.get('tiene_lote')!.disable();
                const { error } = await this._supabase.supabase.from('articulos').update({ stock: 0 }).eq('codigo', this.id);
                if (error) {
                  this._supabase.anadirLog(`ha tenido un error al modificar el campo "stock" del artículo con código ${this.id}`, error.message);
                } else {
                  this._supabase.anadirLog(`ha modificado el campo "stock": ${this.valoresAnteriores['stock']} \u2192 ${this.formArticulo.get('stock')!.value} del artículo con código ${this.id}`);
                }
              } else {
                this.formArticulo.get('stock')!.enable();
              }

              break;

            case 'precio_venta':

              const nuevoMargen = Math.round((((precio_venta - precio_coste) / precio_venta) * 100) * 100) / 100;

              this.formArticulo.get('margen')!.setValue(nuevoMargen);
              this.articulo.margen = nuevoMargen;

              //TODO: hay flickering

              const { error: error2 } = await this._supabase.supabase.from('articulos').update({ margen: nuevoMargen }).eq('codigo', this.id);
              if (error2) {
                this._supabase.anadirLog(`ha tenido un error al modificar el campo "margen" del artículo con código ${this.id}`, error2.message);
              } else {
                this._supabase.anadirLog(`ha modificado el campo "margen": ${this.valoresAnteriores['margen']} \u2192 ${this.formArticulo.get('margen')!.value} del artículo con código ${this.id}`);
              }

              break;

            case 'margen':

              const nuevoPrecioVenta = Math.round((precio_coste / (1 - margen / 100)) * 10000) / 10000;

              this.formArticulo.get('precio_venta')!.setValue(nuevoPrecioVenta);
              this.articulo.precio_venta = nuevoPrecioVenta;

              const { error: error3 } = await this._supabase.supabase.from('articulos').update({ precio_venta: nuevoPrecioVenta }).eq('codigo', this.id);
              if (error3) {
                this._supabase.anadirLog(`ha tenido un error al modificar el campo "precio_venta" del artículo con código ${this.id}`, error3.message);
              } else {
                this._supabase.anadirLog(`ha modificado el campo "precio_venta": ${this.valoresAnteriores['precio_venta']} \u2192 ${this.formArticulo.get('precio_venta')!.value} del artículo con código ${this.id}`);
              }

              break;
          }
        }

      }, (camposSinDelay.includes(campo) ? 0 : 500));
    }
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionArticulo);
  }
}