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
