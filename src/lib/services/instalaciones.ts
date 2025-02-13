import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket } from 'mysql2';

export interface Instalacion extends RowDataPacket {
  id: string;
  nombre: string;
  tipo: string;
  superficie?: string;
  descripcion?: string;
  precio_por_hora: number;
  imagen_url?: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
  capacidad: number;
}

export async function getInstalaciones(): Promise<Instalacion[]> {
  try {
    const instalaciones = await query(
      'SELECT * FROM instalaciones ORDER BY nombre'
    ) as Instalacion[];
    return instalaciones;
  } catch (error) {
    console.error('Error al obtener instalaciones:', error);
    throw error;
  }
}

export async function getInstalacionById(id: string): Promise<Instalacion | null> {
  try {
    const [instalacion] = await query(
      'SELECT * FROM instalaciones WHERE id = ?',
      [id]
    ) as Instalacion[];
    return instalacion || null;
  } catch (error) {
    console.error('Error al obtener instalación:', error);
    throw error;
  }
}

export async function createInstalacion(instalacion: Omit<Instalacion, 'id'>) {
  try {
    const id = uuidv4();
    await query(
      `INSERT INTO instalaciones (
        id, nombre, tipo, superficie, descripcion, 
        precio_por_hora, imagen_url, estado, capacidad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        instalacion.nombre,
        instalacion.tipo,
        instalacion.superficie,
        instalacion.descripcion,
        instalacion.precio_por_hora,
        instalacion.imagen_url,
        instalacion.estado,
        instalacion.capacidad
      ]
    );
    return { id, ...instalacion };
  } catch (error) {
    console.error('Error al crear instalación:', error);
    throw error;
  }
}

export async function updateInstalacion(id: string, instalacion: Partial<Omit<Instalacion, 'id' | 'RowDataPacket'>>) {
  try {
    const updates = Object.entries(instalacion)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key} = ?`);
    
    const values = Object.entries(instalacion)
      .filter(([_, value]) => value !== undefined)
      .map(([_, value]) => value);

    await query(
      `UPDATE instalaciones SET ${updates.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    
    return { id, ...instalacion };
  } catch (error) {
    console.error('Error al actualizar instalación:', error);
    throw error;
  }
}

export async function deleteInstalacion(id: string) {
  try {
    await query('DELETE FROM instalaciones WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error al eliminar instalación:', error);
    throw error;
  }
}