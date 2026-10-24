import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Alerta, EstadoAlerta, FiltrosApi } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

export type { Alerta } from '../../models/api-contract.models';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private readonly endpoint = `${environment.apiUrl}/alertas`;

  constructor(private http: HttpClient) {}

  getAlertas(filters: FiltrosApi = {}): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getAlertasActivas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.endpoint}/activas`);
  }

  getById(id: number): Observable<Alerta> {
    return this.http.get<Alerta>(`${this.endpoint}/${id}`);
  }

  setStatus(id: number, estado: EstadoAlerta): Observable<Alerta> {
    return this.http.patch<Alerta>(`${this.endpoint}/${id}/estado`, { estado });
  }

  cerrarAlerta(id: number): Observable<{ id: number; activa: boolean }> {
    return this.http.post<{ id: number; activa: boolean }>(`${this.endpoint}/${id}/cerrar`, {});
  }
}
