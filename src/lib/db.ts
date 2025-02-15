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
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
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
  // Primero obtenemos las instalaciones con sus horarios
  const sql = `
    WITH horas AS (
      SELECT TIME_FORMAT(MAKETIME(hora, 0, 0), '%H:00') as hora
      FROM (
        SELECT @row := @row + 1 as hora
        FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
              SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t1,
             (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
              SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t2,
        (SELECT @row := 5) t3
        WHERE @row < 23
      ) numeros
    )
    SELECT 
      i.id,
      i.nombre,
      i.tipo,
      hi.hora_apertura,
      hi.hora_cierre,
      h.hora,
      CASE 
        WHEN h.hora < TIME_FORMAT(hi.hora_apertura, '%H:00') OR h.hora >= TIME_FORMAT(hi.hora_cierre, '%H:00') THEN false
        WHEN m.id IS NOT NULL THEN false
        WHEN r.id IS NOT NULL AND r.estado = 'confirmada' THEN false
        ELSE true
      END as disponible
    FROM instalaciones i
    JOIN horarios_instalaciones hi ON i.id = hi.instalacion_id
    CROSS JOIN horas h
    LEFT JOIN mantenimiento m ON i.id = m.instalacion_id 
      AND DATE(?) BETWEEN DATE(m.hora_inicio) AND DATE(m.hora_fin)
      AND h.hora BETWEEN TIME_FORMAT(m.hora_inicio, '%H:00') AND TIME_FORMAT(m.hora_fin, '%H:00')
    LEFT JOIN reservas r ON i.id = r.instalacion_id 
      AND DATE(r.hora_inicio) = DATE(?)
      AND h.hora BETWEEN TIME_FORMAT(r.hora_inicio, '%H:00') AND TIME_FORMAT(r.hora_fin, '%H:00')
    WHERE hi.dia_semana = WEEKDAY(?)
    ORDER BY i.nombre, h.hora`;

  const results = await query(sql, [fecha, fecha, fecha]);

  // Transformar los resultados al formato esperado
  const instalacionesMap = new Map();

  (results as any[]).forEach(row => {
    if (!instalacionesMap.has(row.id)) {
      instalacionesMap.set(row.id, {
        id: row.id,
        nombre: row.nombre,
        tipo: row.tipo,
        hora_apertura: row.hora_apertura,
        hora_cierre: row.hora_cierre,
        slots: []
      });
    }

    instalacionesMap.get(row.id).slots.push({
      hora: row.hora,
      disponible: row.disponible
    });
  });

  return Array.from(instalacionesMap.values());
}

export default pool;