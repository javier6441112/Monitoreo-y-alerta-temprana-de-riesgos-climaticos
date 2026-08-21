import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  getDashboard(): Observable<DashboardData> {
    const data: DashboardData = {
      temperatura: { valor: 27.5, unidad: '°C' },
      humedad: { valor: 78, unidad: '%' },
      viento: { valor: 42, unidad: 'km/h' },
      lluvia: { valor: 18.5, unidad: 'mm/h' },
      nivelRio: { valor: 2.8, unidad: 'm' },
      nivelGeneral: 'AMARILLO',
      alertasActivas: 2,
      sensoresActivos: 4,
      sensoresTotales: 4
    };
    return of(data).pipe(delay(300));
  }
}
