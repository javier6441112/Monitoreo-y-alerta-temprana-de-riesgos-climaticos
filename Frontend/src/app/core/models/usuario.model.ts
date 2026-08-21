export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  rol: 'ADMIN' | 'OPERADOR';
  activo: boolean;
}
