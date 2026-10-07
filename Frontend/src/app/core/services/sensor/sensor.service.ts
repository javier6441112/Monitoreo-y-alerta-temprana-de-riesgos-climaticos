import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FiltrosApi, Sensor, SensorRequest } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

export type { Sensor } from '../../models/api-contract.models';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private readonly endpoint = `${environment.apiUrl}/sensores`;

  constructor(private http: HttpClient) {}

  getSensores(filters: FiltrosApi = {}): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(this.endpoint, { params: toApiParams(filters) });
  }

  getSensor(id: number): Observable<Sensor | undefined> {
    return this.http.get<Sensor>(`${this.endpoint}/${id}`);
  }

  createSensor(sensor: SensorRequest): Observable<Sensor> {
    return this.http.post<Sensor>(this.endpoint, sensor);
  }

  updateSensor(id: number, sensor: Partial<SensorRequest>): Observable<Sensor> {
    return this.http.put<Sensor>(`${this.endpoint}/${id}`, sensor);
  }

  toggleSensor(id: number, activo: boolean): Observable<Sensor> {
    return this.http.patch<Sensor>(`${this.endpoint}/${id}/estado`, { activo });
  }

  deleteSensor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
