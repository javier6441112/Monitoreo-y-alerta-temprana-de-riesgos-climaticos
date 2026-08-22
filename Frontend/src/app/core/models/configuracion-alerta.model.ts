export type NivelAlerta = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';

export type TipoSensor = 'TEMPERATURA' | 'HUMEDAD' | 'VIENTO' | 'LLUVIA' | 'NIVEL_RIO';

export interface ConfiguracionAlerta {
  id: number;
  tipoSensor: TipoSensor | string;
  nivel: NivelAlerta;
  valorMinimo: number;
  fenomeno: string;
  mensaje: string;
  activo: boolean;
}

export interface ConfiguracionAlertaRequest {
  tipoSensor: string;
  nivel: NivelAlerta;
  valorMinimo: number;
  fenomeno: string;
  mensaje: string;
  activo: boolean;
}
