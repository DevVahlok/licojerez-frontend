import { Injectable } from '@angular/core'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from 'src/environments/environment'
import * as XLSX from 'xlsx';
import { UserLicojerez } from 'src/app/models/general';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private user: UserLicojerez;

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

  async anadirLog(texto: string, detalles?: string) {
    await this.supabase.from('logs').insert({ usuario: this.user.username, accion: texto, detalles });
  }
}