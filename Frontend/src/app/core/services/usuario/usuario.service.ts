import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiltrosApi, UsuarioAdmin, UsuarioRequest } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly endpoint = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: FiltrosApi = {}): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getById(id: number): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(`${this.endpoint}/${id}`);
  }

  create(request: UsuarioRequest): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(this.endpoint, request);
  }

  update(id: number, request: UsuarioRequest): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.endpoint}/${id}`, request);
  }

  setActive(id: number, activo: boolean): Observable<UsuarioAdmin> {
    return this.http.patch<UsuarioAdmin>(`${this.endpoint}/${id}/estado`, { activo });
  }
}
