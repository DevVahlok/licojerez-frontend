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

  subirExcelTablaArticulos(archivo: File) {

    const columnMap: { [key: string]: string } = {
      'codigo': 'codigo',
      'descripcion': 'nombre',
      'ean13': 'ean13',
      'alta': 'fecha_alta',
      'existencia': 'stock',
      'costo': 'precio_coste',
      //    'venta': 'precio_venta',
      //    'proveedor': 'proveedor',
      //    'familia': 'familia',
    };
    const numericFields = ['precio_coste', 'ean13', 'stock'];
    const dateFields = ['fecha_alta'];



    const reader: FileReader = new FileReader();

    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {
        type: 'binary',
        cellDates: true // Esto permite que XLSX devuelva objetos Date
      });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { raw: true });

      // Mapeo con conversión de tipos
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
              // Convertir a ISO format
              newRow[dbField] = value.toISOString().split('T')[0]; // yyyy-mm-dd
            } else if (typeof value === 'number') {
              // Si es un número serial de Excel, convertirlo
              const date = XLSX.SSF.parse_date_code(value);
              if (date) {
                const jsDate = new Date(date.y, date.m - 1, date.d);
                newRow[dbField] = jsDate.toISOString().split('T')[0];
              }
            } else if (typeof value === 'string') {
              // Intentar parsear una fecha desde texto
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
      } else {
        this.anadirLog(`ha añadido ${mappedData.length} artículos a través de un excel`);
      }
    };

    reader.readAsBinaryString(archivo);
  }

  async anadirLog(texto: string, detalles?: string) {
    const { error } = await this.supabase.from('logs').insert({ usuario: this.user.username, accion: texto, detalles });
  }
}