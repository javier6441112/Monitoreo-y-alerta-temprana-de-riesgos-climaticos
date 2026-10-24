export interface Alerta {
  id: number;
  nivel: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  fenomeno: 'INUNDACION' | 'SEQUIA' | 'TORMENTA' | 'HELADA' | 'INCENDIO_FORESTAL';
  mensaje: string;
  sensorId: number;
  valorDetectado: number;
  fechaHora: string;
  activa: boolean;
}
