export interface Instalacion {
  id: string;
  nombre: string;
  tipo: 'soccer' | 'basketball' | 'volleyball' | 'swimming';
  superficie?: 'cesped' | 'concreto';
  imagenUrl: string;
  descripcion: string;
  precioPorHora: number;
}

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  created_at: string;
}

export interface Reserva {
  id: string;
  instalacionId: string;
  usuarioId: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  precioTotal: number;
  created_at: string;
}