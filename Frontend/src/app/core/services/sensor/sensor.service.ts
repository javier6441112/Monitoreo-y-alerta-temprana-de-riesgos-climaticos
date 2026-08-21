import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

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
  private sensores: Sensor[] = [
    {
      id: 1,
      nombre: 'Sensor Temperatura 01',
      tipo: 'TEMPERATURA',
      unidad: '°C',
      valorActual: 27.5,
      activo: true,
      comunidadId: 1,
      ultimaLectura: new Date().toISOString()
    },
    {
      id: 2,
      nombre: 'Sensor Río San José',
      tipo: 'NIVEL_RIO',
      unidad: 'm',
      valorActual: 2.8,
      activo: true,
      comunidadId: 1,
      ultimaLectura: new Date().toISOString()
    },
    {
      id: 3,
      nombre: 'Sensor Viento 01',
      tipo: 'VIENTO',
      unidad: 'km/h',
      valorActual: 42,
      activo: true,
      comunidadId: 1,
      ultimaLectura: new Date().toISOString()
    },
    {
      id: 4,
      nombre: 'Sensor Lluvia 01',
      tipo: 'LLUVIA',
      unidad: 'mm/h',
      valorActual: 18.5,
      activo: true,
      comunidadId: 1,
      ultimaLectura: new Date().toISOString()
    }
  ];

  getSensores(): Observable<Sensor[]> {
    return of([...this.sensores]).pipe(delay(300));
  }

  getSensor(id: number): Observable<Sensor | undefined> {
    return of(this.sensores.find(s => s.id === id)).pipe(delay(200));
  }

  createSensor(sensor: Omit<Sensor, 'id' | 'valorActual' | 'ultimaLectura'>): Observable<Sensor> {
    const newSensor: Sensor = {
      ...sensor,
      id: this.sensores.length + 1,
      valorActual: 0,
      ultimaLectura: null
    };
    this.sensores.push(newSensor);
    return of(newSensor).pipe(delay(300));
  }

  updateSensor(id: number, sensor: Partial<Sensor>): Observable<Sensor> {
    const index = this.sensores.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sensores[index] = { ...this.sensores[index], ...sensor };
      return of(this.sensores[index]).pipe(delay(300));
    }
    throw new Error('Sensor no encontrado');
  }

  toggleSensor(id: number, activo: boolean): Observable<Sensor> {
    const index = this.sensores.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sensores[index].activo = activo;
      return of(this.sensores[index]).pipe(delay(200));
    }
    throw new Error('Sensor no encontrado');
  }

  deleteSensor(id: number): Observable<void> {
    this.sensores = this.sensores.filter(s => s.id !== id);
    return of(undefined).pipe(delay(300));
  }
}
