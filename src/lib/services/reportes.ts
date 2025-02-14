import { config } from '../../config/env';

export interface ReporteMensual {
  mes: string;
  total_reservas: number;
  ingresos_totales: number;
  instalacion_mas_reservada: string;
  porcentaje_ocupacion: number;
}

export interface ReporteInstalacion {
  instalacion: string;
  total_reservas: number;
  ingresos: number;
  horas_ocupadas: number;
  porcentaje_ocupacion: number;
}

export async function getReporteMensual(fecha: string): Promise<ReporteMensual> {
  try {
    const response = await fetch(`${config.apiUrl}/api/reportes/mensual?fecha=${fecha}`);
    if (!response.ok) {
      throw new Error('Error al obtener reporte mensual');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener reporte mensual:', error);
    throw error;
  }
}

export async function getReportePorInstalacion(fecha: string): Promise<ReporteInstalacion[]> {
  try {
    const response = await fetch(`${config.apiUrl}/api/reportes/instalaciones?fecha=${fecha}`);
    if (!response.ok) {
      throw new Error('Error al obtener reporte por instalación');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener reporte por instalación:', error);
    throw error;
  }
}