import { config } from '../../config/env';
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
    const response = await fetch(`${config.apiUrl}/api/instalaciones`);
    if (!response.ok) {
      throw new Error('Error al obtener instalaciones');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener instalaciones:', error);
    throw error;
  }
}

export async function getInstalacionById(id: string): Promise<Instalacion | null> {
  try {
    const response = await fetch(`${config.apiUrl}/api/instalaciones/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener instalación');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener instalación:', error);
    throw error;
  }
}

export async function createInstalacion(instalacion: Omit<Instalacion, 'id'>) {
  try {
    const response = await fetch(`${config.apiUrl}/api/instalaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instalacion),
    });
    if (!response.ok) {
      throw new Error('Error al crear instalación');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al crear instalación:', error);
    throw error;
  }
}

export async function updateInstalacion(id: string, instalacion: Partial<Omit<Instalacion, 'id' | 'RowDataPacket'>>) {
  try {
    const response = await fetch(`${config.apiUrl}/api/instalaciones/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instalacion),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar instalación');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al actualizar instalación:', error);
    throw error;
  }
}

export async function deleteInstalacion(id: string) {
  try {
    const response = await fetch(`${config.apiUrl}/api/instalaciones/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar instalación');
    }
    return true;
  } catch (error) {
    console.error('Error al eliminar instalación:', error);
    throw error;
  }
}