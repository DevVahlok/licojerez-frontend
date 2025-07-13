import { Injectable } from '@angular/core'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from 'src/environments/environment'
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private user: any;

  constructor() {
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

  async subirExcelTablaArticulos(archivo: File): Promise<{ success: boolean; inserted?: number; error?: string; }> {
    const columnMap: { [key: string]: string } = {
      'codigo': 'codigo',
      'descripcion': 'nombre',
      'ean13': 'ean13',
      'alta': 'fecha_alta',
      'existencia': 'stock',
      'costo': 'precio_coste',
      // 'venta': 'precio_venta',
      // 'proveedor': 'proveedor',
      // 'familia': 'familia',
    };
    const numericFields = ['precio_coste', 'ean13', 'stock'];
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

      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true
      });

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
            const numberValue = Number(value);
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

      console.log(mappedData);

      const { error } = await this.supabase.from('articulos').insert(mappedData);

      if (error) {
        this.anadirLog(`ha tenido un error al intentar añadir ${mappedData.length} artículos a través de un excel`, error.message);
        return { success: false, error: error.message };
      } else {
        this.anadirLog(`ha añadido ${mappedData.length} artículos a través de un excel`);
        return { success: true, inserted: mappedData.length };
      }
    } catch (err: any) {
      this.anadirLog(`ha tenido un error al procesar un excel para añadir artículos`, err.message || err);
      return { success: false, error: err.message || 'Error desconocido' };
    }
  }

  async anadirLog(texto: string, detalles?: string) {
    await this.supabase.from('logs').insert({ usuario: this.user.username, accion: texto, detalles });
  }
}