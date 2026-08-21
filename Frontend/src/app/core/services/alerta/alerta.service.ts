import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  private alertas: Alerta[] = [
    {
      id: 1,
      nivel: 'AMARILLO',
      fenomeno: 'INUNDACION',
      mensaje: 'Nivel del río en nivel de precaución.',
      sensorId: 2,
      valorDetectado: 3.2,
      fechaHora: new Date(Date.now() - 3600000).toISOString(),
      activa: true
    },
    {
      id: 2,
      nivel: 'NARANJA',
      fenomeno: 'TORMENTA',
      mensaje: 'Velocidad del viento elevada.',
      sensorId: 3,
      valorDetectado: 65,
      fechaHora: new Date(Date.now() - 1800000).toISOString(),
      activa: true
    }
  ];

  getAlertas(): Observable<Alerta[]> {
    return of([...this.alertas]).pipe(delay(300));
  }

  getAlertasActivas(): Observable<Alerta[]> {
    return of(this.alertas.filter(a => a.activa)).pipe(delay(200));
  }

  cerrarAlerta(id: number): Observable<{ id: number; activa: boolean }> {
    const index = this.alertas.findIndex(a => a.id === id);
    if (index !== -1) {
      this.alertas[index].activa = false;
    }
    return of({ id, activa: false }).pipe(delay(200));
  }
}
