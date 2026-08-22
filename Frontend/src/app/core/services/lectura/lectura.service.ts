import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Lectura } from '../../models/lectura.model';

export interface NuevaLectura {
  sensorId: number;
  valor: number;
}

@Injectable({
  providedIn: 'root'
})
export class LecturaService {
  private readonly endpoint = `${environment.apiUrl}/lecturas`;

  constructor(private http: HttpClient) {}

  getLecturas(sensorId?: number): Observable<Lectura[]> {
    let params = new HttpParams();
    if (sensorId) {
      params = params.set('sensorId', sensorId);
    }
    return this.http.get<Lectura[]>(this.endpoint, { params });
  }

  registrarLectura(lectura: NuevaLectura): Observable<Lectura> {
    return this.http.post<Lectura>(this.endpoint, lectura);
  }
}
