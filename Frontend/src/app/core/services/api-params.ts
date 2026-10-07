import { HttpParams } from '@angular/common/http';
import { FiltrosApi } from '../models/api-contract.models';

export function toApiParams(filters: FiltrosApi = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
