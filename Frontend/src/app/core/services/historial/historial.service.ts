import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EstadisticasHistorial, EventoHistorial, FiltrosApi } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

export type HistorialEvent = EventoHistorial;

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private readonly endpoint = `${environment.apiUrl}/historial`;

  constructor(private http: HttpClient) {}

  getHistorial(filters: FiltrosApi = {}): Observable<HistorialEvent[]> {
    return this.http.get<HistorialEvent[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getHistorialBySensor(sensorId: number): Observable<HistorialEvent[]> {
    return this.getHistorial({ sensorId });
  }

  getStatistics(filters: FiltrosApi = {}): Observable<EstadisticasHistorial> {
    return this.http.get<EstadisticasHistorial>(`${this.endpoint}/estadisticas`, { params: toApiParams(filters) });
  }
}
