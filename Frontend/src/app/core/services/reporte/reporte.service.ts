import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export type ReportType = 'COMMUNITIES' | 'SENSORS' | 'READINGS' | 'ALERTS' | 'EVENTS' | 'SENSOR_STATUS' | 'CLIMATE_STATISTICS' | 'EXECUTIVE';
export interface ReportMetadata {
  id: string; type: ReportType; generatedByName: string; generatedAt: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'; fileName: string;
  downloadedAt: string | null; filters: Record<string, unknown>; rowCount?: number;
}
export interface ReportPage { items: ReportMetadata[]; page: number; pageSize: number; total: number; }

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly url = environment.apiUrl + '/reports';
  constructor(private readonly http: HttpClient) {}
  generate(type: ReportType, filters: Record<string, unknown>) {
    return this.http.post<ReportMetadata>(this.url, { type, filters }, {
      headers: new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() })
    });
  }
  history(page = 1) { return this.http.get<ReportPage>(this.url, { params: { page, pageSize: 20 } }); }
  download(id: string) { return this.http.get(this.url + '/' + id + '/download', { responseType: 'blob' }); }
}
