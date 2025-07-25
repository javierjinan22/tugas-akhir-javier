import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  
   canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const expectedRole = route.data['role'];

    // Jika tidak butuh cek role (hanya cek login)
    if (!expectedRole && token) return true;

    // Jika butuh cek role tertentu
    if (token && role === expectedRole) return true;

    // Kalau tidak sesuai, redirect ke landing page
    return this.router.parseUrl('/');
  }
  
}
