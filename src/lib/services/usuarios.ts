import { config } from '../../config/env';
import type { RowDataPacket } from 'mysql2';

export interface Usuario extends RowDataPacket {
  id: string;
  email: string;
  nombre_completo: string;
  telefono?: string;
  role: 'admin' | 'user';
  created_at: string;
}

export async function getUsuarios(): Promise<Usuario[]> {
  try {
    const response = await fetch(`${config.apiUrl}/api/usuarios`);
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

export async function actualizarRolUsuario(id: string, role: 'admin' | 'user'): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/usuarios/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar rol de usuario');
    }
    
    return true;
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error);
    throw error;
  }
}

export async function actualizarUsuario(id: string, data: Partial<Usuario>): Promise<Usuario> {
  try {
    const response = await fetch(`${config.apiUrl}/api/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar usuario');
    }
    
    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
}

export async function eliminarUsuario(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiUrl}/api/usuarios/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar usuario');
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}