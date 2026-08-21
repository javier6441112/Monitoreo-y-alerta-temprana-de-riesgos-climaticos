import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  private eventos: HistorialEvent[] = [
    {
      id: 1,
      fechaHora: new Date(Date.now() - 7200000).toISOString(),
      fenomeno: 'INUNDACION',
      nivel: 'AMARILLO',
      mensaje: 'Nivel del río en nivel de precaución.',
      sensorId: 2
    },
    {
      id: 2,
      fechaHora: new Date(Date.now() - 5400000).toISOString(),
      fenomeno: 'TORMENTA',
      nivel: 'NARANJA',
      mensaje: 'Velocidad del viento elevada.',
      sensorId: 3
    },
    {
      id: 3,
      fechaHora: new Date(Date.now() - 10800000).toISOString(),
      fenomeno: 'INUNDACION',
      nivel: 'VERDE',
      mensaje: 'Nivel del río dentro de parámetros normales.',
      sensorId: 2
    }
  ];

  getHistorial(): Observable<HistorialEvent[]> {
    return of([...this.eventos]).pipe(delay(300));
  }

  getHistorialBySensor(sensorId: number): Observable<HistorialEvent[]> {
    return of(this.eventos.filter(e => e.sensorId === sensorId)).pipe(delay(200));
  }
}
