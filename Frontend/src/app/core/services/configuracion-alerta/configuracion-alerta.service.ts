import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConfiguracionAlerta, ConfiguracionAlertaRequest } from '../../models/configuracion-alerta.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionAlertaService {
  private readonly endpoint = `${environment.apiUrl}/ConfiguracionAlertas`;

  constructor(private http: HttpClient) {}

  getAll(tipoSensor?: string): Observable<ConfiguracionAlerta[]> {
    let params = new HttpParams();
    if (tipoSensor) {
      params = params.set('tipoSensor', tipoSensor);
    }
    return this.http.get<ConfiguracionAlerta[]>(this.endpoint, { params });
  }

  getById(id: number): Observable<ConfiguracionAlerta> {
    return this.http.get<ConfiguracionAlerta>(`${this.endpoint}/${id}`);
  }

  create(request: ConfiguracionAlertaRequest): Observable<ConfiguracionAlerta> {
    return this.http.post<ConfiguracionAlerta>(this.endpoint, request);
  }

  update(id: number, request: ConfiguracionAlertaRequest): Observable<ConfiguracionAlerta> {
    return this.http.put<ConfiguracionAlerta>(`${this.endpoint}/${id}`, request);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
