import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role } from '../../models/api-contract.models';

export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: Role;
  activo?: boolean;
  fechaCreacion?: string;
  ultimoAcceso?: string | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = this.readStoredUser();
    if (storedUser) {
      this.userSubject.next(storedUser);
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        this.userSubject.next(response.user);
      })
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => undefined });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  hasRole(roles: Role[]): boolean {
    const user = this.getUser();
    return !!user && roles.includes(user.rol);
  }

  private readStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(this.userKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
