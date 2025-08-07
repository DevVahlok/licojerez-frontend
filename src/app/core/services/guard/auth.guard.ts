import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})

export class AuthGuard {

  constructor(private _router: Router, private _supabase: SupabaseService) { }

  async canActivate(): Promise<boolean> {

    if (await this._supabase.getUser()) {
      return true;
    }

    this._router.navigate(['/login']);
    return false;
  }
}