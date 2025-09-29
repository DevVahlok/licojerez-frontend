import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import moment from 'moment';
import { SupabaseService } from 'src/app/core/services/supabase/supabase.service';
import { UtilsService } from 'src/app/core/services/utils-v2/utils.service';
import { Centro, Cliente } from 'src/app/models/oficina';
import { DialogConfirmacion } from 'src/app/shared/dialogs/dialog-confirmacion/dialog-confirmacion';
import { ElementoDesplegable } from '../clientes.component';

@Component({
  selector: 'app-ficha-cliente',
  templateUrl: './ficha-cliente.component.html',
  styleUrls: ['./ficha-cliente.component.scss']
})
export class FichaClienteComponent {
  private timer: NodeJS.Timeout;
  private suscripcionCliente: RealtimeChannel;
  private valoresAnteriores: Cliente;
  public cargaCliente: -1 | 0 | 1 = 0;
  private listaIDs: number[];
  public cliente: Cliente;
  public formCliente = new FormGroup({
    id_cliente: new FormControl(-1, Validators.required),
    activo: new FormControl(false, Validators.required),
    fecha_alta: new FormControl('', Validators.required),
    nombre: new FormControl('', Validators.required),
    nombre_comercial: new FormControl(''),
    domicilio: new FormControl(''),
    domicilio_comercial: new FormControl(''),
    codigo_postal: new FormControl(0, Validators.pattern(/^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$/)),
    localidad: new FormControl(''),
    cif: new FormControl('', [Validators.required, Validators.pattern(/^(?:\d{8}[A-Z]|[A-HJNP-SUVW]\d{7}[0-9A-J])$/)]),
    contacto: new FormControl(''),
    telefono_1: new FormControl(0, Validators.pattern(/^[6789]\d{8}$/)),
    telefono_2: new FormControl(0, Validators.pattern(/^[6789]\d{8}$/)),
    email: new FormControl('', Validators.email),
    id_vendedor: new FormControl(-1),
    iban: new FormControl(''),
    descuento: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    recargo_equivalencia: new FormControl(false, Validators.required),
    exento_iva: new FormControl(false, Validators.required),
  });
  public nuevoCliente: boolean = false;
  @Input() id: number;
  @Input() indexTabs: number;
  @Output() cambiarTab = new EventEmitter<number>();
  public formDesplegableVendedor = new FormControl(null);
  public listaDesplegableVendedor: ElementoDesplegable[] | null = [];
  public listaFiltradaDesplegableVendedor: ElementoDesplegable[] | null = [];
  public listaCentros: Centro[] = [
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
    { id_centro: 1, domicilio: 'calle córdoba 22', localidad: 'Jerez de la Frontera', nombre: 'Centro Córdoba', codigo_postal: 11408, fecha_alta: '20/03/2000' },
  ] //TODO: placeholder

  constructor(public _router: Router, public _supabase: SupabaseService, protected _snackbar: MatSnackBar, private _dialog: MatDialog, private _title: Title, private _utils: UtilsService) { }

  async ngOnInit(): Promise<void> {
    this.getPrimerCliente();
    this.getListaIDs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id']?.currentValue) {
      this.resetCliente();
    }

    if (changes['indexTabs']?.currentValue !== null) {
      if (this.indexTabs === 0) {
        this._title.setTitle(this.cliente?.nombre);
      }
    }
  }

  resetCliente() {
    this.nuevoCliente = false;
    this.getCliente();
    this.getListaIDs();
  }

  async getPrimerCliente() {
    this.cargaCliente = 0;
    const { data, error } = await this._supabase.supabase.from('clientes').select('*').order('id_cliente', { ascending: true }).limit(1).single();

    if (error) {
      this.cargaCliente = 1;
    } else {
      this.cargaCliente = -1;
      this.id = data.id_cliente;
      this.getCliente();
    }
  }

  async getListaIDs() {
    const { data, error } = await this._supabase.supabase.from('clientes').select('id_cliente').order('id_cliente', { ascending: true });
    this.listaIDs = data?.map(cliente => cliente.id_cliente)!;
  }

  async getCliente() {
    this.cargaCliente = 0;

    this.suscripcionCliente = this._supabase.supabase.channel(`cliente-${this.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'clientes', filter: `id_cliente=eq.${this.id}` }, payload => {
      this.cliente = payload.new as Cliente;
      this.formCliente.setValue(this.tratamientoPreFormulario())
    }).subscribe();

    const { data, error } = await this._supabase.supabase.from('clientes').select('*').eq('id_cliente', this.id).single();

    if (error) {
      this.cargaCliente = -1;
    } else {
      this.cargaCliente = 1;
      this.cliente = data;

      if (this.indexTabs === 0) {
        this._title.setTitle(this.cliente.nombre);
      }

      const datosForm = this.tratamientoPreFormulario();
      this.formCliente.setValue(datosForm);
      this.valoresAnteriores = datosForm as Cliente;

      this.gestionarFormulario();
      this.getDesplegableVendedores();
    }
  }

  tratamientoPreFormulario() {
    return {
      id_cliente: this.cliente.id_cliente,
      activo: this.cliente.activo,
      fecha_alta: moment(this.cliente.fecha_alta).format('DD/MM/yyyy'),
      nombre: this.cliente.nombre,
      nombre_comercial: this.cliente.nombre_comercial,
      domicilio: this.cliente.domicilio,
      domicilio_comercial: this.cliente.domicilio_comercial,
      codigo_postal: this.cliente.codigo_postal,
      localidad: this.cliente.localidad,
      cif: this.cliente.cif,
      contacto: this.cliente.contacto,
      telefono_1: this.cliente.telefono_1,
      telefono_2: this.cliente.telefono_2,
      email: this.cliente.email,
      id_vendedor: this.cliente.id_vendedor,
      iban: this.cliente.iban,
      descuento: this.cliente.descuento,
      recargo_equivalencia: this.cliente.recargo_equivalencia,
      exento_iva: this.cliente.exento_iva,
    }
  }

  gestionarFormulario() {
    this.formCliente.get('id_cliente')?.disable();
    this.formCliente.get('fecha_alta')?.disable();
  }

  bajaCliente() {
    this._dialog.open(DialogConfirmacion, {
      width: '400px',
      data: { message: `¿Quieres dar de baja el cliente ${this.cliente.nombre}?` },
      disableClose: true
    }).afterClosed().subscribe(async (res) => {

      if (res) {
        const { error } = await this._supabase.supabase.from('clientes').delete().eq('id_cliente', this.cliente.id_cliente);

        if (error) {
          this._snackbar.open(`Ha habido un error al eliminar el cliente ${this.cliente.nombre}`, undefined, { duration: 7000 });
          this._supabase.anadirLog(`ha tenido un error al eliminar el cliente ${this.cliente.nombre} con id ${this.cliente.id_cliente}`, error.message);
        } else {
          this._supabase.anadirLog(`ha eliminado el cliente ${this.cliente.nombre} con id ${this.cliente.id_cliente}`);
          this.getPrimerCliente();
          this.cambiarTab.emit(1);
        }
      }
    })
  }

  async empezarNuevoCliente() {
    this.nuevoCliente = true;

    this._title.setTitle('Creación Cliente');

    this.formCliente.reset();

    this.formCliente.get('id_cliente')!.enable();
    this.formCliente.get('id_cliente')!.setValue(this._utils.detectarSiguienteID(this.listaIDs));
    this.formCliente.get('activo')!.setValue(true);
    this.formCliente.get('descuento')!.setValue(0);
    this.formCliente.get('fecha_alta')!.setValue(moment().format('DD/MM/yyyy'));
  }

  editarCampo<K extends keyof Cliente>(campo: K) {

    const camposSinDelay = ['activo', 'id_vendedor', 'recargo_equivalencia', 'exento_iva']

    clearTimeout(this.timer);

    this.timer = setTimeout(async () => {

      if (this.formCliente.get(campo)?.valid) {

        if (this.nuevoCliente) {
          if (this.formCliente.valid) {
            const nuevoCliente = this.formCliente.getRawValue();
            delete (nuevoCliente as any).fecha_alta;
            delete (nuevoCliente as any).formato;

            const { data } = await this._supabase.supabase.from('clientes').select('*').eq('id_cliente', nuevoCliente.id_cliente).order('id_cliente');

            if (data!.length > 0) {
              await this.getListaIDs();
              nuevoCliente.id_cliente = this._utils.detectarSiguienteID(this.listaIDs);
            }

            const { error } = await this._supabase.supabase.from('clientes').insert(nuevoCliente);

            if (error) {
              this._supabase.anadirLog(`ha tenido un error al crear el cliente "${nuevoCliente.nombre}"`, error.message);
            } else {
              this._supabase.anadirLog(`ha creado el cliente "${nuevoCliente.nombre}" con código ${nuevoCliente.id_cliente}`);

              this._snackbar.open(`Cliente creado correctamente.`, undefined, { duration: 7000 });

              this.id = this.formCliente.getRawValue().id_cliente!;
              this.resetCliente();
            }

          }
        } else {

          if (this.formCliente.get(campo)!.value === '') this.formCliente.get(campo)!.setValue(null as any);

          const { error } = await this._supabase.supabase.from('clientes').update({ [campo]: this.formCliente.get(campo)!.value }).eq('id_cliente', this.id)

          if (error) {
            this._snackbar.open(`Ha habido un error al modificar el campo: ${campo}`, undefined, { duration: 7000 });
            this._supabase.anadirLog(`ha tenido un error al modificar el campo "${campo}" del cliente con código ${this.id}`, error.message);
          } else {
            this.cliente[campo] = this.formCliente.get(campo)!.value as Cliente[K];
            this._supabase.anadirLog(`ha modificado el campo "${campo}": ${this.valoresAnteriores[campo]} \u2192 ${this.formCliente.get(campo)!.value} del cliente con código ${this.id}`);
            this.valoresAnteriores[campo] = this.formCliente.get(campo)!.value;
          }

        }
      }
    }, (camposSinDelay.includes(campo) ? 0 : 500));
  }

  filtrarDesplegableSearch() {
    this.listaFiltradaDesplegableVendedor = this.listaDesplegableVendedor;
    this.formDesplegableVendedor.valueChanges.pipe().subscribe(() => {
      if (!this.formDesplegableVendedor.value || this.formDesplegableVendedor.value === '') {
        this.listaFiltradaDesplegableVendedor = this.listaDesplegableVendedor;
      } else {
        this.listaFiltradaDesplegableVendedor = this.listaDesplegableVendedor!?.filter(prov => prov.nombre.toLowerCase().includes((this.formDesplegableVendedor.value! as string).toLowerCase()));
      }
    });
  }

  async getDesplegableVendedores() {

    const { data } = await this._supabase.supabase.from('vendedores').select('*').order('id_vendedor');

    this.listaDesplegableVendedor = data?.map(prov => { return { codigo: prov.id_vendedor, nombre: prov.nombre } })!;
    this.filtrarDesplegableSearch();
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionCliente);
  }
}