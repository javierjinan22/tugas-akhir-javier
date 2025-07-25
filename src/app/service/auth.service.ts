import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/literadoo';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    // Guru atau siswa, kirim ke endpoint /users/register
    return this.http.post(`${this.apiUrl}/users/register`, data);
  }

  login(data: any): Observable<any> {
    // Login, endpoint /login/login
    return this.http.post(`${this.apiUrl}/login/login`, data);
  }
}
