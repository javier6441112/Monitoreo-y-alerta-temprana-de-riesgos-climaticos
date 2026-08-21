import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardData {
  temperatura: { valor: number; unidad: string };
  humedad: { valor: number; unidad: string };
  viento: { valor: number; unidad: string };
  lluvia: { valor: number; unidad: string };
  nivelRio: { valor: number; unidad: string };
  nivelGeneral: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  alertasActivas: number;
  sensoresActivos: number;
  sensoresTotales: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`);
  }
}
