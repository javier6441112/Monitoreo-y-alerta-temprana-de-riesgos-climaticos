import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Sensor {
  id: number;
  nombre: string;
  tipo: 'TEMPERATURA' | 'HUMEDAD' | 'VIENTO' | 'LLUVIA' | 'NIVEL_RIO';
  unidad: string;
  valorActual: number;
  activo: boolean;
  comunidadId: number;
  ultimaLectura: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private readonly endpoint = `${environment.apiUrl}/sensores`;

  constructor(private http: HttpClient) {}

  getSensores(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(this.endpoint);
  }

  getSensor(id: number): Observable<Sensor | undefined> {
    return this.http.get<Sensor>(`${this.endpoint}/${id}`);
  }

  createSensor(sensor: Omit<Sensor, 'id' | 'valorActual' | 'ultimaLectura'>): Observable<Sensor> {
    return this.http.post<Sensor>(this.endpoint, sensor);
  }

  updateSensor(id: number, sensor: Partial<Sensor>): Observable<Sensor> {
    return this.http.put<Sensor>(`${this.endpoint}/${id}`, sensor);
  }

  toggleSensor(id: number, activo: boolean): Observable<Sensor> {
    return this.http.patch<Sensor>(`${this.endpoint}/${id}/estado`, { activo });
  }

  deleteSensor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
