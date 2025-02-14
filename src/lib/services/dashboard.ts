import { config } from '../../config/env';

export interface DashboardStats {
  total_reservas: number;
  usuarios_activos: number;
  ingresos_mensuales: number;
  cambio_reservas: string;
  cambio_usuarios: string;
  cambio_ingresos: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${config.apiUrl}/api/dashboard/stats`);
    if (!response.ok) {
      throw new Error('Error al obtener estadísticas del dashboard');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    throw error;
  }
}