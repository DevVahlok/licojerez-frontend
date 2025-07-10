import { Injectable } from '@angular/core'
import { AuthChangeEvent, AuthSession, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js'
import { environment } from 'src/environments/environment'

export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;
  _session: AuthSession | null = null;
  private user: any;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    })
    return this._session
  }

  async setUser(user: User) {
    const e = await this.supabase.from('profiles').select('*').eq('id', user.id).single()
    this.user = e.data
  }

  getUser() {
    return this.user;
  }

  signIn(user: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email: `${user}@licojerez.es`, password })
  }

  signOut() {
    return this.supabase.auth.signOut()
  }

  getDatosTablaArticulos() {

  }
}