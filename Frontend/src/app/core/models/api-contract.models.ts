export type Role = 'ADMIN' | 'OPERADOR' | 'CONSULTA';
export type NivelAlerta = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
export type EstadoAlerta = 'ACTIVA' | 'ATENDIDA' | 'CERRADA';
export type TipoSensor =
  | 'TEMPERATURA'
  | 'HUMEDAD'
  | 'VIENTO'
  | 'LLUVIA'
  | 'NIVEL_RIO'
  | 'RESERVORIO'
  | 'HUMO'
  | 'OTRO';

export interface Comunidad {
  id: number;
  nombre: string;
  municipio: string;
  departamento: string;
  pais: string;
  latitud: number | null;
  longitud: number | null;
  descripcion: string;
  activo: boolean;
  sensoresActivos: number;
  sensoresTotales: number;
}

export type ComunidadRequest = Omit<Comunidad, 'id' | 'sensoresActivos' | 'sensoresTotales'>;

export interface Sensor {
  id: number;
  nombre: string;
  codigo: string;
  tipo: TipoSensor;
  unidad: string;
  valorActual: number;
  activo: boolean;
  comunidadId: number;
  comunidadNombre?: string;
  latitud: number | null;
  longitud: number | null;
  fechaInstalacion: string | null;
  descripcion: string;
  ultimaLectura: string | null;
}

export type SensorRequest = Omit<Sensor, 'id' | 'valorActual' | 'ultimaLectura' | 'comunidadNombre'>;

export interface Lectura {
  id: number;
  sensorId: number;
  comunidadId: number;
  fechaHora: string;
  valor: number;
  unidad: string;
  estadoSensor: boolean;
}

export interface ReglaAlerta {
  id: number;
  nombre: string;
  tipoSensor: TipoSensor;
  valorMinimo: number | null;
  valorMaximo: number | null;
  nivel: NivelAlerta;
  fenomeno: string;
  mensaje: string;
  activo: boolean;
}

export type ReglaAlertaRequest = Omit<ReglaAlerta, 'id'>;

export interface Alerta {
  id: number;
  fechaHora: string;
  comunidadId: number;
  comunidadNombre: string;
  sensorId: number;
  sensorNombre: string;
  configuracionAlertaId: number;
  fenomeno: string;
  nivel: NivelAlerta;
  valorDetectado: number;
  valorMinimo: number | null;
  valorMaximo: number | null;
  mensaje: string;
  estado?: EstadoAlerta;
  activa?: boolean;
  atendidaPorId: number | null;
  atendidaPorNombre: string | null;
  fechaAtencion: string | null;
  cerradaPorId: number | null;
  cerradaPorNombre: string | null;
  fechaCierre: string | null;
}

export interface EventoHistorial {
  id: number;
  fechaHora: string;
  comunidadId: number;
  comunidadNombre?: string;
  sensorId: number;
  sensorNombre?: string;
  alertaId: number | null;
  fenomeno: string;
  nivel: NivelAlerta;
  valor: number | null;
  mensaje: string;
  estado: EstadoAlerta | string;
  responsableId: number | null;
  responsableNombre: string | null;
}

export interface EventoAuditoria {
  id: number;
  usuarioId: number | null;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  descripcion: string;
  fechaHora: string;
}

export interface UsuarioAdmin {
  id: number;
  username: string;
  nombre: string;
  rol: Role;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
}

export interface UsuarioRequest {
  username: string;
  nombre: string;
  rol: Role;
  activo: boolean;
  password?: string;
}

export interface FiltrosApi {
  desde?: string;
  hasta?: string;
  buscar?: string;
  codigo?: string;
  comunidadId?: number | string;
  sensorId?: number | string;
  tipo?: string;
  tipoSensor?: string;
  activo?: boolean | string;
  municipio?: string;
  departamento?: string;
  fenomeno?: string;
  nivel?: string;
  estado?: string;
  usuarioId?: number | string;
  accion?: string;
  entidad?: string;
  rol?: string;
}

export interface SerieLectura {
  fechaHora: string;
  valor: number;
}

export interface DashboardData {
  temperatura: { valor: number; unidad: string };
  humedad: { valor: number; unidad: string };
  viento: { valor: number; unidad: string };
  lluvia: { valor: number; unidad: string };
  nivelRio: { valor: number; unidad: string };
  nivelGeneral: NivelAlerta;
  alertasActivas: number;
  sensoresActivos: number;
  sensoresTotales: number;
  comunidades: number;
  sensoresInactivos: number;
  alertasPorNivel: Partial<Record<NivelAlerta, number>>;
  eventosRecientes: EventoHistorial[];
}

export interface EstadisticasHistorial {
  totalEventos: number;
  porNivel: Partial<Record<NivelAlerta, number>>;
  porFenomeno: Record<string, number>;
}
