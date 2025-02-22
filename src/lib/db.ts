import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
dotenv.config();

// Interfaces
export interface Instalacion {
  id: string;
  nombre: string;
  tipo: 'soccer' | 'basketball' | 'volleyball' | 'swimming';
  superficie?: 'cesped' | 'concreto';
  descripcion: string;
  precio_por_hora: number;
  imagen_url?: string;
}

export interface HorarioInstalacion {
  id: string;
  instalacion_id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
}

// Configuración de la conexión
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 4, // Reducir el límite de conexiones
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para probar la conexión
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con MySQL:', error);
    return false;
  }
}

// Función para ejecutar consultas
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  }
}

// Función para obtener todas las instalaciones
export async function getInstalacionesFromDB() {
  const sql = `
    SELECT i.*, 
           CASE 
             WHEN m.id IS NOT NULL THEN 'mantenimiento'
             WHEN r.id IS NOT NULL AND r.estado = 'confirmada' AND NOW() BETWEEN r.hora_inicio AND r.hora_fin THEN 'ocupado'
             ELSE 'disponible'
           END as estado
    FROM instalaciones i
    LEFT JOIN mantenimiento m ON i.id = m.instalacion_id 
      AND NOW() BETWEEN m.hora_inicio AND m.hora_fin
    LEFT JOIN reservas r ON i.id = r.instalacion_id 
      AND NOW() BETWEEN r.hora_inicio AND r.hora_fin`;
  return await query(sql);
}

// Función para crear una instalación
export async function createInstalacionInDB(data: Omit<Instalacion, 'id'>) {
  const id = uuidv4();
  const sql = `
    INSERT INTO instalaciones (
      id, nombre, tipo, superficie, descripcion, precio_por_hora, imagen_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  await query(sql, [
    id,
    data.nombre,
    data.tipo,
    data.superficie || null,
    data.descripcion,
    data.precio_por_hora,
    data.imagen_url || null
  ]);

  return { id, ...data };
}

// Función para actualizar una instalación
export async function updateInstalacionInDB(id: string, data: Partial<Instalacion>) {
  const updates = [];
  const values = [];

  if (data.nombre) {
    updates.push('nombre = ?');
    values.push(data.nombre);
  }
  if (data.tipo) {
    updates.push('tipo = ?');
    values.push(data.tipo);
  }
  if (data.superficie !== undefined) {
    updates.push('superficie = ?');
    values.push(data.superficie);
  }
  if (data.descripcion) {
    updates.push('descripcion = ?');
    values.push(data.descripcion);
  }
  if (data.precio_por_hora) {
    updates.push('precio_por_hora = ?');
    values.push(data.precio_por_hora);
  }
  if (data.imagen_url !== undefined) {
    updates.push('imagen_url = ?');
    values.push(data.imagen_url);
  }

  if (updates.length === 0) return null;

  const sql = `
    UPDATE instalaciones 
    SET ${updates.join(', ')}
    WHERE id = ?
  `;
  
  values.push(id);
  await query(sql, values);

  return { id, ...data };
}

// Función para eliminar una instalación
export async function deleteInstalacionFromDB(id: string) {
  const sql = 'DELETE FROM instalaciones WHERE id = ?';
  await query(sql, [id]);
  return true;
}

// Función para obtener disponibilidad de instalaciones
export async function getDisponibilidadInstalaciones(fecha: string) {
  try {
    // Obtener toda la información necesaria en una sola consulta
    const sql = `
      SELECT 
        i.id,
        i.nombre,
        i.tipo,
        hi.hora_apertura,
        hi.hora_cierre,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            TIME_FORMAT(r.hora_inicio, '%H:%i'),
            '-',
            TIME_FORMAT(r.hora_fin, '%H:%i')
          )
        ) as reservas,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            TIME_FORMAT(m.hora_inicio, '%H:%i'),
            '-',
            TIME_FORMAT(m.hora_fin, '%H:%i')
          )
        ) as mantenimientos
      FROM instalaciones i
      JOIN horarios_instalaciones hi ON i.id = hi.instalacion_id
      LEFT JOIN reservas r ON i.id = r.instalacion_id 
        AND DATE(r.hora_inicio) = ?
        AND r.estado = 'confirmada'
      LEFT JOIN mantenimiento m ON i.id = m.instalacion_id 
        AND DATE(m.hora_inicio) = ?
      WHERE hi.dia_semana = WEEKDAY(?)
      GROUP BY i.id, i.nombre, i.tipo, hi.hora_apertura, hi.hora_cierre
    `;

    const instalaciones = await query(sql, [fecha, fecha, fecha]);

    return (instalaciones as any[]).map(instalacion => {
      const slots = [];
      let horaActual = new Date(`${fecha}T${instalacion.hora_apertura}`);
      const horaCierre = new Date(`${fecha}T${instalacion.hora_cierre}`);

      // Convertir las reservas y mantenimientos a arrays de rangos
      const reservas = instalacion.reservas ? 
        instalacion.reservas.split(',').map((r: string) => {
          const [inicio, fin] = r.split('-');
          return { inicio, fin };
        }) : [];

      const mantenimientos = instalacion.mantenimientos ?
        instalacion.mantenimientos.split(',').map((m: string) => {
          const [inicio, fin] = m.split('-');
          return { inicio, fin };
        }) : [];

      // Generar slots
      while (horaActual < horaCierre) {
        const horaSlot = horaActual.toTimeString().slice(0, 5);
        
        // Verificar si el slot está disponible
        const estaReservado = reservas.some(r => 
          horaSlot >= r.inicio && horaSlot < r.fin
        );
        
        const enMantenimiento = mantenimientos.some(m =>
          horaSlot >= m.inicio && horaSlot < m.fin
        );

        slots.push({
          hora: horaSlot,
          disponible: !estaReservado && !enMantenimiento
        });

        horaActual.setHours(horaActual.getHours() + 1);
      }

      return {
        id: instalacion.id,
        nombre: instalacion.nombre,
        tipo: instalacion.tipo,
        hora_apertura: instalacion.hora_apertura,
        hora_cierre: instalacion.hora_cierre,
        slots
      };
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    throw error;
  }
}

export default pool;