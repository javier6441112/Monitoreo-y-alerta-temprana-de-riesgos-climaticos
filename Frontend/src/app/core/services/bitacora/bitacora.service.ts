import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventoAuditoria, FiltrosApi } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly endpoint = `${environment.apiUrl}/bitacora`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: FiltrosApi = {}): Observable<EventoAuditoria[]> {
    return this.http.get<EventoAuditoria[]>(this.endpoint, { params: toApiParams(filters) });
  }
}
