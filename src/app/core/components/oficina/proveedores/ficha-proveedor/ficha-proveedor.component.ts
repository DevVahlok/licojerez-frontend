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
import { Proveedor } from 'src/app/models/oficina';
import { DialogConfirmacion } from 'src/app/shared/dialogs/dialog-confirmacion/dialog-confirmacion';

@Component({
  selector: 'app-ficha-proveedor',
  templateUrl: './ficha-proveedor.component.html',
  styleUrls: ['./ficha-proveedor.component.scss']
})
export class FichaProveedorComponent {
  private timer: NodeJS.Timeout;
  private suscripcionProveedor: RealtimeChannel;
  private valoresAnteriores: Proveedor;
  public cargaProveedor: -1 | 0 | 1 = 0;
  private listaIDs: number[];
  public proveedor: Proveedor;
  public formProveedor = new FormGroup({
    id_proveedor: new FormControl(-1, Validators.required),
    nombre: new FormControl('', Validators.required),
    activo: new FormControl(false, Validators.required),
    direccion: new FormControl(''),
    codigo_postal: new FormControl(0, Validators.pattern(/^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$/)),
    ciudad: new FormControl(''),
    provincia: new FormControl(''),
    cif: new FormControl('', [Validators.required, Validators.pattern(/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/)]),
    descuento: new FormControl(0, Validators.pattern(/^-?\d+(\.\d+)?$/)),
    fecha_alta: new FormControl('', Validators.required),
  });
  public nuevoProveedor: boolean = false;
  @Input() id: number;
  @Input() indexTabs: number;
  @Output() cambiarTab = new EventEmitter<number>();

  constructor(public _router: Router, public _supabase: SupabaseService, protected _snackbar: MatSnackBar, private _dialog: MatDialog, private _title: Title, private _utils: UtilsService) { }

  async ngOnInit(): Promise<void> {
    this.getPrimerProveedor();
    this.getListaIDs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['id']?.currentValue) {
      this.resetProveedor();
    }

    if (changes['indexTabs']?.currentValue !== null) {
      if (this.indexTabs === 0) {
        this._title.setTitle(this.proveedor?.nombre);
      }
    }
  }

  resetProveedor() {
    this.nuevoProveedor = false;
    this.getProveedor();
    this.getListaIDs();
  }

  async getPrimerProveedor() {
    this.cargaProveedor = 0;
    const { data, error } = await this._supabase.supabase.from('proveedores').select('*').order('id_proveedor', { ascending: true }).limit(1).single();

    if (error) {
      this.cargaProveedor = 1;
    } else {
      this.cargaProveedor = -1;
      this.id = data.id_proveedor;
      this.getProveedor();
    }
  }

  async getListaIDs() {
    const { data, error } = await this._supabase.supabase.from('proveedores').select('id_proveedor').order('id_proveedor', { ascending: true });
    this.listaIDs = data?.map(proveedor => proveedor.id_proveedor)!;
  }

  async getProveedor() {
    this.cargaProveedor = 0;

    this.suscripcionProveedor = this._supabase.supabase.channel(`proveedor-${this.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'proveedores', filter: `id_proveedor=eq.${this.id}` }, payload => {
      this.proveedor = payload.new as Proveedor;
      this.formProveedor.setValue(this.tratamientoPreFormulario())
    }).subscribe();

    const { data, error } = await this._supabase.supabase.from('proveedores').select('*').eq('id_proveedor', this.id).single();

    if (error) {
      this.cargaProveedor = -1;
    } else {
      this.cargaProveedor = 1;
      this.proveedor = data;

      if (this.indexTabs === 0) {
        this._title.setTitle(this.proveedor.nombre);
      }

      const datosForm = this.tratamientoPreFormulario();
      this.formProveedor.setValue(datosForm);
      this.valoresAnteriores = datosForm as Proveedor;

      this.gestionarFormulario();
    }
  }

  tratamientoPreFormulario() {
    return {
      id_proveedor: this.proveedor.id_proveedor,
      nombre: this.proveedor.nombre,
      activo: this.proveedor.activo,
      direccion: this.proveedor.direccion,
      codigo_postal: this.proveedor.codigo_postal,
      ciudad: this.proveedor.ciudad,
      provincia: this.proveedor.provincia,
      cif: this.proveedor.cif,
      descuento: this.proveedor.descuento,
      fecha_alta: moment(this.proveedor.fecha_alta).format('DD/MM/yyyy')
    }
  }

  gestionarFormulario() {
    this.formProveedor.get('id_proveedor')?.disable();
    this.formProveedor.get('fecha_alta')?.disable();
  }

  bajaProveedor() {
    this._dialog.open(DialogConfirmacion, {
      width: '400px',
      data: { message: `¿Quieres dar de baja el proveedor ${this.proveedor.nombre}?` },
      disableClose: true
    }).afterClosed().subscribe(async (res) => {

      if (res) {
        const { error } = await this._supabase.supabase.from('proveedores').delete().eq('id_proveedor', this.proveedor.id_proveedor);

        if (error) {
          this._snackbar.open(`Ha habido un error al eliminar el proveedor ${this.proveedor.nombre}`, undefined, { duration: 7000 });
          this._supabase.anadirLog(`ha tenido un error al eliminar el proveedor ${this.proveedor.nombre} con id ${this.proveedor.id_proveedor}`, error.message);
        } else {
          this._supabase.anadirLog(`ha eliminado el proveedor ${this.proveedor.nombre} con id ${this.proveedor.id_proveedor}`);
          this.getPrimerProveedor();
          this.cambiarTab.emit(1);
        }
      }
    })
  }

  async empezarNuevoProveedor() {
    this.nuevoProveedor = true;

    this._title.setTitle('Creación Proveedor');

    this.formProveedor.reset();

    this.formProveedor.get('id_proveedor')!.enable();
    this.formProveedor.get('id_proveedor')!.setValue(this._utils.detectarSiguienteID(this.listaIDs));
    this.formProveedor.get('activo')!.setValue(true);
    this.formProveedor.get('descuento')!.setValue(0);
    this.formProveedor.get('fecha_alta')!.setValue(moment().format('DD/MM/yyyy'));
  }

  editarCampo<K extends keyof Proveedor>(campo: K) {

    const camposSinDelay = ['activo']

    clearTimeout(this.timer);

    this.timer = setTimeout(async () => {

      if (this.formProveedor.get(campo)?.valid) {

        if (this.nuevoProveedor) {
          if (this.formProveedor.valid) {
            const nuevoProveedor = this.formProveedor.getRawValue();
            delete (nuevoProveedor as any).fecha_alta;
            delete (nuevoProveedor as any).formato;

            const { data } = await this._supabase.supabase.from('proveedores').select('*').eq('id_proveedor', nuevoProveedor.id_proveedor).order('id_proveedor');

            if (data!.length > 0) {
              await this.getListaIDs();
              nuevoProveedor.id_proveedor = this._utils.detectarSiguienteID(this.listaIDs);
            }

            const { error } = await this._supabase.supabase.from('proveedores').insert(nuevoProveedor);

            if (error) {
              this._supabase.anadirLog(`ha tenido un error al crear el proveedor "${nuevoProveedor.nombre}"`, error.message);
            } else {
              this._supabase.anadirLog(`ha creado el proveedor "${nuevoProveedor.nombre}" con código ${nuevoProveedor.id_proveedor}`);

              this._snackbar.open(`Proveedor creado correctamente.`, undefined, { duration: 7000 });

              this.id = this.formProveedor.getRawValue().id_proveedor!;
              this.resetProveedor();
            }

          }
        } else {

          if (this.formProveedor.get(campo)!.value === '') this.formProveedor.get(campo)!.setValue(null as any);

          const { error } = await this._supabase.supabase.from('proveedores').update({ [campo]: this.formProveedor.get(campo)!.value }).eq('id_proveedor', this.id)

          if (error) {
            this._snackbar.open(`Ha habido un error al modificar el campo: ${campo}`, undefined, { duration: 7000 });
            this._supabase.anadirLog(`ha tenido un error al modificar el campo "${campo}" del proveedor con código ${this.id}`, error.message);
          } else {
            this.proveedor[campo] = this.formProveedor.get(campo)!.value as Proveedor[K];
            this._supabase.anadirLog(`ha modificado el campo "${campo}": ${this.valoresAnteriores[campo]} \u2192 ${this.formProveedor.get(campo)!.value} del proveedor con código ${this.id}`);
            this.valoresAnteriores[campo] = this.formProveedor.get(campo)!.value;
          }

        }
      }
    }, (camposSinDelay.includes(campo) ? 0 : 500));
  }

  ngOnDestroy() {
    this._supabase.supabase.removeChannel(this.suscripcionProveedor);
  }
}