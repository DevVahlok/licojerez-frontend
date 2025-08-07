import { Component, Input, SimpleChange, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { ArticulosComponent, ListaDesplegablesFichaArticulo } from '../articulos.component';
import { Articulo, Familia, Marca, Proveedor, Subfamilia } from 'src/app/models/oficina';
import { RealtimeChannel } from '@supabase/supabase-js';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-ficha-articulo',
  templateUrl: './ficha-articulo.component.html',
  styleUrls: ['./ficha-articulo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FichaArticuloComponent {

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

  public listaVendedores: any = [];
  public listaVendedoresFiltrada: any = [];
  public inputVendedor = new FormControl('');
  public listasDesplegables: ListaDesplegablesFichaArticulo = {
    proveedor: null,
    familia: null,
    subfamilia: null,
    iva: null,
    marca: null,
  }
  @Input() id: number;
  public articulo: Articulo;
  public formArticulo = new FormGroup({
    codigo: new FormControl(-1, Validators.required),
    fecha_alta: new FormControl('', Validators.required),
    nombre: new FormControl('', Validators.required),
    ean13_1: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_2: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_3: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_4: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    ean13_5: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    stock: new FormControl(0, [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]),
    precio_coste: new FormControl(0, Validators.required),
    tipo: new FormControl('Material', Validators.required),
    precio_venta: new FormControl(0, Validators.required),
    idProveedor: new FormControl(-1),
    idFamilia: new FormControl(-1),
    idSubfamilia: new FormControl(-1),
    idIva: new FormControl(-1, Validators.required),
    margen: new FormControl(0, Validators.required),
    activo: new FormControl(false, Validators.required),
    comision_default: new FormControl(0),
    tiene_lote: new FormControl(false, Validators.required),
    idMarca: new FormControl(-1),
    formato: new FormControl(null)
  });

  constructor(public _router: Router, public _supabase: SupabaseService, protected _snackbar: MatSnackBar) { }

  async ngOnInit(): Promise<void> {
    this.spinner = true;
    this.getListasDesplegables();
    this.conseguirVendedores();
    this.conseguirPrimerArticulo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id']?.currentValue) {
      this.conseguirArticulo();
    }
  }

  async conseguirPrimerArticulo() {
    const { data } = await this._supabase.supabase.from('articulos').select('*').order('codigo', { ascending: true }).limit(1).single();
    this.id = data.codigo;
    this.conseguirArticulo();
  }

  getListasDesplegables() {

    from(this._supabase.supabase.from<any, Proveedor[]>('proveedores').select('*')).subscribe(async ({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, proveedor: data?.map(prov => { return { codigo: prov.codigo, nombre: prov.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Familia[]>('familias').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, familia: data?.map(fam => { return { codigo: fam.codigo, nombre: fam.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Subfamilia[]>('subfamilias').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, subfamilia: data?.map(subfam => { return { codigo: subfam.codigo, nombre: subfam.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
    });

    from(this._supabase.supabase.from<any, Marca[]>('marcas').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, marca: data?.map(marca => { return { codigo: marca.codigo, nombre: marca.nombre }; })! } as ListaDesplegablesFichaArticulo;
      }
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

  onListasDesplegablesCambiada(valor: ListaDesplegablesFichaArticulo) {
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
    this.formArticulo.get('stock')?.disable();

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