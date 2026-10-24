export interface Dashboard {
  temperatura: { valor: number; unidad: string };
  humedad: { valor: number; unidad: string };
  viento: { valor: number; unidad: string };
  lluvia: { valor: number; unidad: string };
  nivelRio: { valor: number; unidad: string };
  nivelGeneral: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  alertasActivas: number;
  sensoresActivos: number;
  sensoresTotales: number;
}
