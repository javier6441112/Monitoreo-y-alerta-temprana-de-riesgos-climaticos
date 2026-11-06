import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReglaAlerta, ReglaAlertaRequest, FiltrosApi } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionAlertaService {
  private readonly endpoint = `${environment.apiUrl}/configuracionalertas`;

  constructor(private http: HttpClient) {}

  getAll(filters: FiltrosApi = {}): Observable<ReglaAlerta[]> {
    return this.http.get<ReglaAlerta[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getById(id: number): Observable<ReglaAlerta> {
    return this.http.get<ReglaAlerta>(`${this.endpoint}/${id}`);
  }

  create(request: ReglaAlertaRequest): Observable<ReglaAlerta> {
    return this.http.post<ReglaAlerta>(this.endpoint, request);
  }

  update(id: number, request: ReglaAlertaRequest): Observable<ReglaAlerta> {
    return this.http.put<ReglaAlerta>(`${this.endpoint}/${id}`, request);
  }

  setActive(id: number, activo: boolean): Observable<ReglaAlerta> {
    return this.http.patch<ReglaAlerta>(`${this.endpoint}/${id}/estado`, { activo });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
