import { Component, EventEmitter, Input, Output, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ListaDesplegablesFichaArticulo } from '../articulos.component';
import { Articulo, Familia, IVA, Marca, Proveedor, Subfamilia } from 'src/app/models/oficina';
import { RealtimeChannel } from '@supabase/supabase-js';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { from } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogConfirmacion } from 'src/app/shared/dialogs/dialog-confirmacion/dialog-confirmacion';
import { EtiquetasService } from 'src/app/core/services/etiquetas/etiquetas.service';
import { Title } from '@angular/platform-browser';

interface Vendedor {
  codigo: number,
  nombre: string,
  comision: number
}

@Component({
  selector: 'app-ficha-articulo',
  templateUrl: './ficha-articulo.component.html',
  styleUrls: ['./ficha-articulo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FichaArticuloComponent {
  private timer: NodeJS.Timeout;
  private suscripcionArticulo: RealtimeChannel;
  private valoresAnteriores: Articulo;
  public formFiltrosDesplegables = new FormGroup({
    proveedor: new FormControl(null),
    familia: new FormControl(null),
    subfamilia: new FormControl(null),
    marca: new FormControl(null),
    formato: new FormControl(null)
  });
  public listasFiltradasDesplegables: ListaDesplegablesFichaArticulo = {
    proveedor: [],
    familia: [],
    subfamilia: [],
    iva: [],
    marca: [],
  }
  public listaVendedores: Vendedor[] = [];
  public listaVendedoresFiltrada: Vendedor[] = [];
  public inputVendedor = new FormControl('');
  public listasDesplegables: ListaDesplegablesFichaArticulo = {
    proveedor: null,
    familia: null,
    subfamilia: null,
    iva: null,
    marca: null,
  }
  @Input() id: number;
  @Input() indexTabs: number;
  public articulo: Articulo;
  public formArticulo = new FormGroup({
    id_articulo: new FormControl(-1, Validators.required),
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
    id_proveedor: new FormControl(-1),
    id_familia: new FormControl(-1),
    id_subfamilia: new FormControl(-1),
    id_iva: new FormControl(-1, Validators.required),
    margen: new FormControl(0, Validators.required),
    activo: new FormControl(false, Validators.required),
    comision_default: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    tiene_lote: new FormControl(false, Validators.required),
    id_marca: new FormControl(-1),
    formato: new FormControl(null)
  });
  @Output() cambiarTab = new EventEmitter<number>();
  public listaVendedoresDialog: Vendedor[];
  public dialogRef: MatDialogRef<any>;
  @ViewChild('dialogEditarComision') dialogEditarComision: TemplateRef<any>;
  public comisionDefaultDialog = 0;
  public nuevoArticulo: boolean = false;
  private listaIDs: number[];
  private comisionesVendedoresNuevoArticulo: Vendedor[] = [];
  public cargaDialogComisiones: -1 | 0 | 1 = 0;
  public cargaVendedores: -1 | 0 | 1 = 0;
  public cargaArticulo: -1 | 0 | 1 = 0;

  constructor(public _router: Router, public _supabase: SupabaseService, protected _snackbar: MatSnackBar, private _dialog: MatDialog, private _etiquetas: EtiquetasService, private _title: Title) { }

  async ngOnInit(): Promise<void> {
    this.getPrimerArticulo();
    this.getListaIDs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id']?.currentValue) {
      this.resetArticulo();
    }

    if (changes['indexTabs']?.currentValue !== null) {
      if (this.indexTabs === 0) {
        this._title.setTitle(this.articulo.nombre);
      }
    }
  }

  resetArticulo() {
    this.nuevoArticulo = false;
    this.formArticulo.get('margen')!.enable();
    this.getArticulo();
    this.getVendedores();
    this.getListaIDs();
  }

  async getPrimerArticulo() {
    this.cargaArticulo = 0;
    const { data, error } = await this._supabase.supabase.from('articulos').select('*').order('id_articulo', { ascending: true }).limit(1).single();

    if (error) {
      this.cargaArticulo = 1;
    } else {
      this.cargaArticulo = -1;
      this.id = data.id_articulo;
      this.getArticulo();
      this.getVendedores();
    }
  }

  async getListaIDs() {
    const { data, error } = await this._supabase.supabase.from('articulos').select('id_articulo').order('id_articulo', { ascending: true });
    this.listaIDs = data?.map(articulo => articulo.id_articulo)!;
  }

  getListasDesplegables() {

    from(this._supabase.supabase.from<any, Proveedor[]>('proveedores').select('*')).subscribe(async ({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, proveedor: data?.map(prov => { return { codigo: prov.id_proveedor, nombre: prov.nombre }; })! } as ListaDesplegablesFichaArticulo;
        this.filtrarDesplegableSearch('proveedor');
      }
    });

    from(this._supabase.supabase.from<any, Familia[]>('familias').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, familia: data?.map(fam => { return { codigo: fam.id_familia, nombre: fam.nombre }; })! } as ListaDesplegablesFichaArticulo;
        this.filtrarDesplegableSearch('familia');
      }
    });

    if (this.formArticulo.get('id_familia')!.value !== null && this.formArticulo.get('id_familia')!.value !== -1) {
      from(this._supabase.supabase.from('subfamilias').select('*').eq('id_familia', this.formArticulo.get('id_familia')!.value)).subscribe(({ data, error }) => {
        if (!error) {
          const subfamilias = (data ?? []) as Subfamilia[];
          this.listasDesplegables = { ...this.listasDesplegables, subfamilia: subfamilias.map(subfamilia => ({ codigo: subfamilia.id_subfamilia, nombre: subfamilia.nombre })) } as unknown as ListaDesplegablesFichaArticulo;
          this.filtrarDesplegableSearch('subfamilia');
        }
      });
    }

    from(this._supabase.supabase.from<any, Marca[]>('marcas').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, marca: data?.map(marca => { return { codigo: marca.id_marca, nombre: marca.nombre }; })! } as ListaDesplegablesFichaArticulo;
        this.filtrarDesplegableSearch('marca');
      }
    });

    from(this._supabase.supabase.from<any, IVA[]>('ivas').select('*')).subscribe(({ data, error }) => {
      if (!error) {
        this.listasDesplegables = { ...this.listasDesplegables, iva: data?.map(iva => { return { codigo: iva.id_iva, nombre: iva.valor_iva }; })! } as ListaDesplegablesFichaArticulo;
      }
    });
  }

  async getVendedores() {
    this.cargaVendedores = 0;
    const { data, error } = await this._supabase.supabase.from('comisiones_articulos').select(`id_comision, comision, vendedores (*)`).eq('id_articulo', this.id).order('comision', { ascending: false });

    if (error) {
      this.cargaVendedores = -1;
    } else {
      this.cargaVendedores = 1;
      this.listaVendedores = (data as unknown as { vendedores: { nombre: string, created_at: string, id_vendedor: number }, id_comision: number, comision: number }[]).map(vendedor => { return { codigo: vendedor.id_comision, nombre: vendedor.vendedores.nombre, comision: vendedor.comision } })
    }

    this.listaVendedoresFiltrada = structuredClone(this.listaVendedores)
  }

  filtrarVendedores() {
    this.listaVendedoresFiltrada = this.listaVendedores.filter((vendedor: any) => vendedor.nombre.toLowerCase().includes(this.inputVendedor.value!.toLowerCase()))
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

  async getArticulo() {
    this.cargaArticulo = 0;
    //TODO: aplicar sockets a cada desplegable (cada vez que se crea una subfamilia, por ejemplo), también en lista vendedores

    this.suscripcionArticulo = this._supabase.supabase.channel(`articulo-${this.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'articulos', filter: `codigo=eq.${this.id}` }, payload => {
      this.articulo = payload.new as Articulo;
      this.formArticulo.setValue(this.tratamientoPreFormulario())
    }).subscribe();

    const { data, error } = await this._supabase.supabase.from('articulos').select('*').eq('id_articulo', this.id).single();

    if (error) {
      this.cargaArticulo = -1;
    } else {
      this.cargaArticulo = 1;
      this.articulo = data;

      if (this.indexTabs === 0) {
        this._title.setTitle(this.articulo.nombre);
      }

      const datosForm = this.tratamientoPreFormulario();
      this.formArticulo.setValue(datosForm);
      this.valoresAnteriores = datosForm;

      this.gestionarFormulario();
      this.getListasDesplegables();
    }
  }

  gestionarFormulario() {
    this.formArticulo.get('id_articulo')?.disable();
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

    if (this.formArticulo.get('id_familia')!.value === -1) {
      this.formArticulo.get('id_subfamilia')!.disable();
    }

    this.formArticulo.get('formato')!.disable();
  }

  tratamientoPreFormulario() {
    return {
      id_articulo: this.articulo.id_articulo,
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
      id_proveedor: this.articulo.id_proveedor,
      id_familia: this.articulo.id_familia,
      id_subfamilia: this.articulo.id_subfamilia,
      id_iva: this.articulo.id_iva,
      margen: this.articulo.margen,
      activo: this.articulo.activo,
      comision_default: this.articulo.comision_default,
      tiene_lote: this.articulo.tiene_lote,
      id_marca: this.articulo.id_marca,
      formato: null
    }
  }

  editarCampo<K extends keyof Articulo>(campo: K) {

    const camposSinDelay = ['activo', 'tiene_lote', 'tipo']

    clearTimeout(this.timer);

    this.timer = setTimeout(async () => {

      if (this.formArticulo.get(campo)?.valid) {

        if (this.nuevoArticulo) {

          if (campo === 'comision_default') {
            this.comisionDefaultDialog = Number(this.formArticulo.get(campo)!.value);
          }

          if (this.formArticulo.valid) {

            const nuevoArticulo = this.formArticulo.getRawValue();
            delete (nuevoArticulo as any).fecha_alta;
            delete (nuevoArticulo as any).formato;

            const { data } = await this._supabase.supabase.from('articulos').select('*').eq('id_articulo', nuevoArticulo.id_articulo).order('id_articulo');

            if (data!.length > 0) {
              await this.getListaIDs();
              nuevoArticulo.id_articulo = this.detectarSiguienteID();
            }

            const { error } = await this._supabase.supabase.from('articulos').insert(nuevoArticulo);

            if (error) {
              this._supabase.anadirLog(`ha tenido un error al crear el artículo "${nuevoArticulo.nombre}"`, error.message);
            } else {
              this._supabase.anadirLog(`ha creado el artículo "${nuevoArticulo.nombre}" con código ${nuevoArticulo.id_articulo}`);

              if (this.comisionesVendedoresNuevoArticulo.length > 0) {
                this.comisionesVendedoresNuevoArticulo.filter(vendedor => vendedor.comision > 0).forEach(async (vendedor, i) => {
                  const { error } = await this._supabase.supabase.from('comisiones_articulos').insert({ id_articulo: nuevoArticulo.id_articulo, id_vendedor: vendedor.codigo, comision: vendedor.comision });
                })
              }

              this._snackbar.open(`Artículo creado correctamente.`, undefined, { duration: 7000 });

              this._dialog.open(DialogConfirmacion, {
                width: '400px',
                data: { message: `¿Quieres imprimir una etiqueta?` }
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this._etiquetas.anadirEtiqueta({
                    id_articulo: nuevoArticulo.id_articulo!,
                    nombre: nuevoArticulo.nombre!,
                    precio_final: Number(nuevoArticulo.precio_venta!),
                    precio_sin_iva: Math.round(Number(nuevoArticulo.precio_venta!) / (1 + Number(this.listasDesplegables.iva?.find(iva => Number(iva.codigo) === nuevoArticulo.id_iva)?.nombre) / 100) * 100) / 100
                  })
                }
              });

              this.id = this.formArticulo.getRawValue().id_articulo!;
              this.resetArticulo();
            }
          }

        } else {

          if (this.formArticulo.get(campo)!.value === '') this.formArticulo.get(campo)!.setValue(null as any);

          const { error } = await this._supabase.supabase.from('articulos').update({ [campo]: this.formArticulo.get(campo)!.value }).eq('id_articulo', this.id)

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
                  const { error } = await this._supabase.supabase.from('articulos').update({ stock: 0 }).eq('id_articulo', this.id);
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

                const { error: error2 } = await this._supabase.supabase.from('articulos').update({ margen: nuevoMargen }).eq('id_articulo', this.id);
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

                const { error: error3 } = await this._supabase.supabase.from('articulos').update({ precio_venta: nuevoPrecioVenta }).eq('id_articulo', this.id);
                if (error3) {
                  this._supabase.anadirLog(`ha tenido un error al modificar el campo "precio_venta" del artículo con código ${this.id}`, error3.message);
                } else {
                  this._supabase.anadirLog(`ha modificado el campo "precio_venta": ${this.valoresAnteriores['precio_venta']} \u2192 ${this.formArticulo.get('precio_venta')!.value} del artículo con código ${this.id}`);
                }

                break;

              case 'id_familia':

                this.listasDesplegables.subfamilia = null;
                this.articulo.id_subfamilia = -1;
                this.formArticulo.get('id_subfamilia')!.setValue(-1);

                from(this._supabase.supabase.from('articulos').update({ id_subfamilia: null }).eq('id_articulo', this.formArticulo.get('id_articulo')!.value)).subscribe(({ data, error }) => {
                  if (error) {
                    this._supabase.anadirLog(`ha tenido un error al modificar el campo "subfamilia" del artículo con código ${this.id}`, error.message);
                  } else {
                    this._supabase.anadirLog(`ha modificado el campo "subfamilia": ${this.valoresAnteriores['id_subfamilia']} \u2192 "" del artículo con código ${this.id}`);
                  }
                });

                from(this._supabase.supabase.from('subfamilias').select('*').eq('id_familia', this.formArticulo.get('id_familia')!.value)).subscribe(({ data, error }) => {
                  if (!error) {
                    const subfamilias = (data ?? []) as Subfamilia[];
                    this.listasDesplegables = { ...this.listasDesplegables, subfamilia: subfamilias.map(subfamilia => ({ codigo: subfamilia.id_subfamilia, nombre: subfamilia.nombre })) } as unknown as ListaDesplegablesFichaArticulo;
                    this.filtrarDesplegableSearch('subfamilia');
                  }
                });

                break;

              case 'comision_default':
                this.comisionDefaultDialog = Number(this.formArticulo.get(campo)!.value);
                break;
            }
          }
        }
      }
    }, (camposSinDelay.includes(campo) ? 0 : 500));
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionArticulo);
  }

  bajaArticulo() {
    this._dialog.open(DialogConfirmacion, {
      width: '400px',
      data: { message: `¿Quieres dar de baja el artículo ${this.articulo.nombre}?` }
    }).afterClosed().subscribe(async (res) => {

      if (res) {
        const { error } = await this._supabase.supabase.from('articulos').delete().eq('id_articulo', this.articulo.id_articulo);

        if (error) {
          this._snackbar.open(`Ha habido un error al eliminar el artículo ${this.articulo.nombre}`, undefined, { duration: 7000 });
          this._supabase.anadirLog(`ha tenido un error al eliminar el artículo ${this.articulo.nombre} con id ${this.articulo.id_articulo}`, error.message);
        } else {
          this._supabase.anadirLog(`ha eliminado el artículo ${this.articulo.nombre} con id ${this.articulo.id_articulo}`);
          this.getPrimerArticulo();
          this.cambiarTab.emit(1);
        }
      }
    })
  }

  abrirDialogEditarComisiones() {
    this.dialogRef = this._dialog.open(this.dialogEditarComision);
    this.cargarComisiones();
  }

  async cargarComisiones() {
    this.cargaDialogComisiones = 0;

    const { data, error } = await this._supabase.supabase.from('vendedores').select('*').order('nombre');

    if (error) {
      this.cargaDialogComisiones = -1;
    } else {
      this.cargaDialogComisiones = 1;
      if (this.nuevoArticulo) {
        this.listaVendedoresDialog = data?.map(vendedor => { return { codigo: vendedor.id_vendedor, nombre: vendedor.nombre, comision: this.comisionesVendedoresNuevoArticulo.find(vend => vend.codigo === vendedor.id_vendedor)?.comision ?? 0 } })!;
      } else {
        this.listaVendedoresDialog = data?.map(vendedor => { return { codigo: vendedor.id_vendedor, nombre: vendedor.nombre, comision: 0 } })!;
      }

      this.listaVendedores.forEach((vendedor) => {
        const vend = this.listaVendedoresDialog.find(vendedor2 => vendedor.nombre === vendedor2.nombre);
        if (vend) vend.comision = vendedor.comision;
      });
    }
  }

  async modificarComision(vendedor: Vendedor) {
    vendedor.comision = Number(vendedor.comision);

    if (this.nuevoArticulo) {

      const antiguoVendedor = this.comisionesVendedoresNuevoArticulo.find(vend => vend.codigo === vendedor.codigo);

      if (antiguoVendedor) {
        antiguoVendedor.comision = vendedor.comision;
      } else {
        this.comisionesVendedoresNuevoArticulo.push(vendedor);
      }

    } else {

      const { data, error } = await this._supabase.supabase.from('comisiones_articulos').select('*').eq('id_articulo', this.articulo.id_articulo).eq('id_vendedor', vendedor.codigo);

      if (data!.length === 0) {
        const { error } = await this._supabase.supabase.from('comisiones_articulos').insert({ id_articulo: this.id, id_vendedor: vendedor.codigo, comision: vendedor.comision });

        if (error) {
          this._snackbar.open(`Ha habido un error al añadir la comisión de "${vendedor.nombre}"`, undefined, { duration: 7000 });
          this._supabase.anadirLog(`ha tenido un error al añadir la comisión: "${vendedor.nombre} (${vendedor.comision}%)" al artículo "${this.articulo.nombre} con id ${this.articulo.id_articulo}"`, error.message);
        } else {
          this._supabase.anadirLog(`ha añadido la comisión: "${vendedor.nombre} (${vendedor.comision}%)" al artículo "${this.articulo.nombre} con id ${this.articulo.id_articulo}"`);
        }

      } else if (data!.length === 1) {
        if (vendedor.comision === 0) {
          const { error } = await this._supabase.supabase.from('comisiones_articulos').delete().eq('id_articulo', this.id).eq('id_vendedor', vendedor.codigo);
          if (error) {
            this._snackbar.open(`Ha habido un error al eliminar la comisión de "${vendedor.nombre}"`, undefined, { duration: 7000 });
            this._supabase.anadirLog(`ha tenido un error al eliminar la comisión de: "${vendedor.nombre}" del artículo "${this.articulo.nombre} con id ${this.articulo.id_articulo}"`, error.message);
          }
        } else {
          const { error } = await this._supabase.supabase.from('comisiones_articulos').update({ comision: vendedor.comision }).eq('id_articulo', this.id).eq('id_vendedor', vendedor.codigo);
          if (error) {
            this._snackbar.open(`Ha habido un error al modificar la comisión de "${vendedor.nombre}"`, undefined, { duration: 7000 });
            this._supabase.anadirLog(`ha tenido un error al modificar la comisión de: "${vendedor.nombre}" a "${vendedor.comision}%" del artículo "${this.articulo.nombre} con id ${this.articulo.id_articulo}"`, error.message);
          }
        }
      }

      this.getVendedores();
      this.inputVendedor.setValue('');
    }
  }

  editarComisionDefaultDialog() {
    this.formArticulo.get('comision_default')!.setValue(Number(this.comisionDefaultDialog));
    this.editarCampo('comision_default')
  }

  anadirEtiqueta() {
    this._etiquetas.anadirEtiqueta({
      id_articulo: this.id,
      nombre: this.articulo.nombre,
      precio_final: this.articulo.precio_venta,
      precio_sin_iva: Math.round(this.articulo.precio_venta / (1 + Number(this.listasDesplegables.iva?.find(iva => Number(iva.codigo) === this.articulo.id_iva)?.nombre) / 100) * 100) / 100
    })
  }

  async empezarNuevoArticulo() {
    this.nuevoArticulo = true;
    this.comisionesVendedoresNuevoArticulo = [];

    this._title.setTitle('Creación Artículo');

    this.formArticulo.reset();
    this.listaVendedores = [];
    this.listaVendedoresFiltrada = [];

    this.formArticulo.get('id_articulo')!.enable();
    this.formArticulo.get('id_articulo')!.setValue(this.detectarSiguienteID());
    this.formArticulo.get('stock')!.enable();
    this.formArticulo.get('stock')!.setValue(0);
    this.formArticulo.get('tiene_lote')!.enable();
    this.formArticulo.get('margen')!.disable();
    this.formArticulo.get('activo')!.setValue(true);
    this.formArticulo.get('tiene_lote')!.setValue(false);
    this.formArticulo.get('comision_default')!.setValue(0);
    this.formArticulo.get('fecha_alta')!.setValue(moment().format('DD/MM/yyyy'));
  }

  detectarSiguienteID(): number {
    const set = new Set(this.listaIDs);
    const min = Math.min(...this.listaIDs);
    const max = Math.max(...this.listaIDs);

    for (let i = min; i <= max; i++) {
      if (!set.has(i)) return i;
    }

    return this.listaIDs[this.listaIDs.length - 1] + 1;
  }
}