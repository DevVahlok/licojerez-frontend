import { Injectable } from '@angular/core'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from 'src/environments/environment'
import * as XLSX from 'xlsx';
import { UtilsService } from '../utils-v2/utils.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private user: any;

  constructor(private _utils: UtilsService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  async setUser(user: User) {
    const e = await this.supabase.from('profiles').select('*').eq('id', user.id).single();
    this.user = e.data;
    const { data } = await this.supabase.auth.getSession()
    if (data) window.localStorage.setItem('auth-token', data.session?.access_token!);
  }

  async getUser() {

    if (!this.user && window.localStorage.getItem('auth-token')) {
      const { data } = await this.supabase.auth.getUser();
      if (data) await this.setUser(data.user!)
    }
    return this.user;
  }

  signIn(user: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email: `${user}@licojerez.es`, password })
  }

  signOut() {
    return this.supabase.auth.signOut()
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  async subirExcelTablaArticulos(archivo: File): Promise<{ success: boolean; data?: any[]; error?: 'supabase' | 'duplicated', showError?: string, errorField?: string }> {
    const columnMap: { [key: string]: string } = {
      'codigo': 'codigo',
      'descripcion': 'nombre',
      'costo': 'precio_coste',
      'venta': 'precio_venta',
      'ean13': 'ean13_1',
      'existencia': 'stock',
      'proveedor': 'proveedor',
      'tipo': 'tipo',
      'familia': 'familia',
      'iva': 'iva',
      'margen': 'margen',
      'activo': 'activo',
      'comision': 'comision_default',
      'alta': 'fecha_alta',
      'chasis': 'tiene_lote'
    };
    const numericFields = ['codigo', 'precio_coste', 'precio_venta', 'ean13', 'stock', 'ean13_1', 'proveedor', 'familia', 'margen', 'comision_default'];
    const numericFields4Decimals = ['precio_coste', 'precio_venta'];
    const dateFields = ['fecha_alta'];

    try {
      const bstr: string = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: any) => {
          resolve(e.target.result);
        };

        reader.onerror = (e) => {
          reject(new Error("Error al leer el archivo Excel"));
        };

        reader.readAsBinaryString(archivo);
      });

      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { raw: true });

      const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        for (const key in row) {
          const dbField = columnMap[key];
          if (!dbField) continue;

          let value = row[key];

          if (numericFields.includes(dbField)) {
            const numberValue = parseFloat(Number(value).toFixed(numericFields4Decimals.includes(columnMap[key]) ? 4 : 2));
            newRow[dbField] = isNaN(numberValue) ? null : numberValue;

          } else if (dateFields.includes(dbField)) {
            if (value instanceof Date) {
              newRow[dbField] = value.toISOString().split('T')[0];
            } else if (typeof value === 'number') {
              const date = XLSX.SSF.parse_date_code(value);
              if (date) {
                const jsDate = new Date(date.y, date.m - 1, date.d);
                newRow[dbField] = jsDate.toISOString().split('T')[0];
              }
            } else if (typeof value === 'string') {
              const parsed = new Date(value);
              newRow[dbField] = isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
            } else {
              newRow[dbField] = null;
            }

          } else {
            newRow[dbField] = value;
          }
        }
        return newRow;
      });

      //Tratamiento datos

      ///////////Campo código

      //Convertir todos los códigos a número 
      const productosConCodigoNumerico = mappedData.map(p => ({ ...p, codigo: Number(p.codigo) }));

      // Paso 2: Contar ocurrencias de cada código
      const contador = new Map<number, number>();

      for (const producto of productosConCodigoNumerico) {
        const codigo = producto.codigo;
        contador.set(codigo, (contador.get(codigo) || 0) + 1);
      }

      // Paso 3: Filtrar los códigos que aparecen más de una vez
      const codigosDuplicados = Array.from(contador.entries()).filter(([_, count]) => count > 1).map(([codigo]) => codigo);

      // Opcional: mostrar productos con código duplicado
      const productosDuplicados = productosConCodigoNumerico.filter(p =>
        codigosDuplicados.includes(p.codigo as number)
      );

      if (productosDuplicados.length > 0) {
        this.anadirLog(`ha tenido un error al intentar añadir ${mappedData.length} artículos a través de un excel`, 'El excel contiene datos duplicados (columna "codigo")');
        return { success: false, error: 'duplicated', data: productosDuplicados, showError: `El excel contiene datos duplicados (columna Código)`, errorField: 'codigo' };
      }

      const resIVA = await this.supabase.from('ivas').select('*').order('codigo');

      mappedData.forEach(articulo => {

        //Campo Stock
        articulo.stock = Math.trunc(articulo.stock);

        //Campo EAN13
        articulo.ean13_1 = Number(articulo.ean13_1);
        if (articulo.ean13_1 === 0) articulo.ean13_1 = null;

        //Campo Tipo
        articulo.tipo = articulo.tipo === 1 ? 'Material' : 'Servicio';
        if (articulo.tipo === 'Servicio') articulo.stock = null;

        //Campo IVA
        if (articulo.iva === 'N') articulo.iva = resIVA.data?.find(iva => iva.valor_iva === 21).codigo;
        if (articulo.iva === 'R') articulo.iva = resIVA.data?.find(iva => iva.valor_iva === 10).codigo;
        if (articulo.iva === 'S') articulo.iva = resIVA.data?.find(iva => iva.valor_iva === 4).codigo;

        //Nombre
        articulo.nombre = articulo.nombre.trim();
      })

      console.log(mappedData);

      const { error } = await this.supabase.from('articulos').insert(mappedData);

      if (error) {
        this.anadirLog(`ha tenido un error al intentar añadir ${mappedData.length} artículos a través de un excel`, error.message);
        return { success: false, error: 'supabase' };
      } else {
        this.anadirLog(`ha añadido ${mappedData.length} artículos a través de un excel`);
        return { success: true, data: mappedData };
      }
    } catch (err: any) {
      this.anadirLog(`ha tenido un error al procesar un excel para añadir artículos`, err.message || err);
      return { success: false, error: 'supabase' };
    }
  }

  async anadirLog(texto: string, detalles?: string) {
    await this.supabase.from('logs').insert({ usuario: this.user.username, accion: texto, detalles });
  }
}