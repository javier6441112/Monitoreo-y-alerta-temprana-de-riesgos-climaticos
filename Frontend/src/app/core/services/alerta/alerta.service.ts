import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Alerta {
  id: number;
  nivel: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  fenomeno: string;
  mensaje: string;
  sensorId: number;
  valorDetectado: number;
  fechaHora: string;
  activa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertaService {
  private readonly endpoint = `${environment.apiUrl}/alertas`;

  constructor(private http: HttpClient) {}

  getAlertas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.endpoint);
  }

  getAlertasActivas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.endpoint}/activas`);
  }

  cerrarAlerta(id: number): Observable<{ id: number; activa: boolean }> {
    return this.http.post<{ id: number; activa: boolean }>(`${this.endpoint}/${id}/cerrar`, {});
  }
}
