import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FiltrosApi, Lectura } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

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

  getLecturas(sensorId?: number, filters: FiltrosApi = {}): Observable<Lectura[]> {
    const params = toApiParams({ ...filters, ...(sensorId ? { sensorId } : {}) });
    return this.http.get<Lectura[]>(this.endpoint, { params });
  }

  registrarLectura(lectura: NuevaLectura): Observable<Lectura> {
    return this.http.post<Lectura>(this.endpoint, lectura);
  }
}
