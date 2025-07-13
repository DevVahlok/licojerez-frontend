import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';

/** Se inyecta en la base del proyecto */

@Injectable({
  providedIn: 'root',
})

/**
 * 
 * Valida si el usuario está almacenado en la sesion del navegador. Si no esta almacenado, redirige a la pantalla de Login.
 *
 */

export class AuthGuard {

  /** Inyección de dependencias */
  constructor(private _router: Router, private _supabase: SupabaseService) { }

  /**
   * 
   * Valida si el usuario está almacenado en la sesion del navegador. 
   * Si no esta almacenado, redirige a la pantalla de Login.
   * 
   * @param route Ruta 
   * @param state Estado del router
   * @returns Si está validado
   * 
   */

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    if (await this._supabase.getUser()) {
      return true;
    }

    this._router.navigate(['/login']);
    return false;
  }
}
