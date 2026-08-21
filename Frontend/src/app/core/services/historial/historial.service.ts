import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HistorialEvent {
  id: number;
  fechaHora: string;
  fenomeno: string;
  nivel: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  mensaje: string;
  sensorId: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private readonly endpoint = `${environment.apiUrl}/historial`;

  constructor(private http: HttpClient) {}

  getHistorial(): Observable<HistorialEvent[]> {
    return this.http.get<HistorialEvent[]>(this.endpoint);
  }

  getHistorialBySensor(sensorId: number): Observable<HistorialEvent[]> {
    return this.http.get<HistorialEvent[]>(this.endpoint, { params: { sensorId } });
  }
}
