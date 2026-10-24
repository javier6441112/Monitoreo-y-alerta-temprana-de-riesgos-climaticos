export interface Historial {
  id: number;
  fechaHora: string;
  fenomeno: 'INUNDACION' | 'SEQUIA' | 'TORMENTA' | 'HELADA' | 'INCENDIO_FORESTAL';
  nivel: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  mensaje: string;
  sensorId: number;
}
