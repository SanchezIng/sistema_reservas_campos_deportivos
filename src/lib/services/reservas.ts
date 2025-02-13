import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Reserva {
  id: string;
  instalacion_id: string;
  usuario_id: string;
  hora_inicio: Date;
  hora_fin: Date;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  precio_total: number;
}

export async function getReservas(filters?: {
  instalacionId?: string;
  usuarioId?: string;
  fecha?: Date;
}) {
  try {
    let sql = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];

    if (filters?.instalacionId) {
      sql += ' AND instalacion_id = ?';
      params.push(filters.instalacionId);
    }

    if (filters?.usuarioId) {
      sql += ' AND usuario_id = ?';
      params.push(filters.usuarioId);
    }

    if (filters?.fecha) {
      sql += ' AND DATE(hora_inicio) = DATE(?)';
      params.push(filters.fecha);
    }

    sql += ' ORDER BY hora_inicio';

    const reservas = await query(sql, params);
    return reservas;
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

export async function createReserva(reserva: Omit<Reserva, 'id'>) {
  try {
    const id = uuidv4();
    await query(
      `INSERT INTO reservas (
        id, instalacion_id, usuario_id, hora_inicio, 
        hora_fin, estado, precio_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reserva.instalacion_id,
        reserva.usuario_id,
        reserva.hora_inicio,
        reserva.hora_fin,
        reserva.estado,
        reserva.precio_total
      ]
    );
    return { id, ...reserva };
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
}

export async function updateReservaEstado(id: string, estado: Reserva['estado']) {
  try {
    await query(
      'UPDATE reservas SET estado = ? WHERE id = ?',
      [estado, id]
    );
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de reserva:', error);
    throw error;
  }
}