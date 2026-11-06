import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardData, FiltrosApi, SerieLectura } from '../../models/api-contract.models';
import { toApiParams } from '../api-params';

export type { DashboardData } from '../../models/api-contract.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(filters: FiltrosApi = {}): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`, { params: toApiParams(filters) });
  }

  getSeries(filters: FiltrosApi = {}): Observable<SerieLectura[]> {
    return this.http.get<SerieLectura[]>(`${environment.apiUrl}/dashboard/series`, { params: toApiParams(filters) });
  }
}
