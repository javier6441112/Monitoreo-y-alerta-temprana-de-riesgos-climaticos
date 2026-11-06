import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comunidad, ComunidadRequest, FiltrosApi } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComunidadService {
  private readonly endpoint = `${environment.apiUrl}/comunidades`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: FiltrosApi = {}): Observable<Comunidad[]> {
    return this.http.get<Comunidad[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getById(id: number): Observable<Comunidad> {
    return this.http.get<Comunidad>(`${this.endpoint}/${id}`);
  }

  create(request: ComunidadRequest): Observable<Comunidad> {
    return this.http.post<Comunidad>(this.endpoint, request);
  }

  update(id: number, request: ComunidadRequest): Observable<Comunidad> {
    return this.http.put<Comunidad>(`${this.endpoint}/${id}`, request);
  }

  setActive(id: number, activo: boolean): Observable<Comunidad> {
    return this.http.patch<Comunidad>(`${this.endpoint}/${id}/estado`, { activo });
  }
}
