import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface HorarioInstalacion {
  id: string;
  instalacion_id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
}

export async function getHorariosInstalacion(instalacionId: string) {
  try {
    const horarios = await query(
      'SELECT * FROM horarios_instalaciones WHERE instalacion_id = ? ORDER BY dia_semana',
      [instalacionId]
    );
    return horarios;
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    throw error;
  }
}

export async function createHorarioInstalacion(horario: Omit<HorarioInstalacion, 'id'>) {
  try {
    const id = uuidv4();
    await query(
      `INSERT INTO horarios_instalaciones (
        id, instalacion_id, dia_semana, hora_apertura, hora_cierre
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        horario.instalacion_id,
        horario.dia_semana,
        horario.hora_apertura,
        horario.hora_cierre
      ]
    );
    return { id, ...horario };
  } catch (error) {
    console.error('Error al crear horario:', error);
    throw error;
  }
}