import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { registerUser, authenticateUser } from './lib/auth';
import { 
  testConnection, 
  getInstalacionesFromDB,
  getDisponibilidadInstalaciones,
  createInstalacionInDB,
  updateInstalacionInDB,
  deleteInstalacionFromDB
} from './lib/db';
import { query } from './lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const app = express();

// Middleware
app.use(cors({
  origin: ['https://sistema-reservas-campos-deportivos.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(bodyParser.json());

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Probar conexión a la base de datos al iniciar
testConnection().then((connected) => {
  if (connected) {
    console.log('Base de datos conectada correctamente');
  } else {
    console.error('No se pudo conectar a la base de datos');
  }
});

// Rutas de autenticación
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { email, password, nombreCompleto, telefono } = req.body;
    console.log('Datos de registro recibidos:', { email, nombreCompleto, telefono });
    const user = await registerUser({ email, password, nombreCompleto, telefono });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Intento de login para:', email);
    const result = await authenticateUser(email, password);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(401).json({ success: false, error: error.message });
  }
});


// Nueva ruta para solicitar recuperación de contraseña
app.post('/api/auth/recuperar-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar si el usuario existe
    const [user]: any = await query(
      'SELECT id, email, nombre_completo FROM usuarios WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No existe una cuenta con este correo electrónico'
      });
    }

    // Generar token de recuperación
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '1h' }
    );

    // Guardar token en la base de datos
    await query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [resetToken, user.id]
    );

    // Enviar correo
    const resetUrl = `${process.env.FRONTEND_URL}/restablecer-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña - DeporteYa',
      html: `
        <h1>Recuperación de contraseña</h1>
        <p>Hola ${user.nombre_completo},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña'
    });
  } catch (error: any) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud de recuperación de contraseña'
    });
  }
});

// Ruta para verificar token de reset
app.post('/api/auth/verificar-token-reset', async (req, res) => {
  try {
    const { token } = req.body;

    // Verificar si el token existe y no ha expirado
    const [user]: any = await query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token no válido o expirado'
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el token'
    });
  }
});

// Ruta para restablecer contraseña
app.post('/api/auth/restablecer-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verificar token y obtener usuario
    const [user]: any = await query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token no válido o expirado'
      });
    }

    // Generar hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Actualizar contraseña y limpiar token
    await query(
      'UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restablecer la contraseña'
    });
  }
});


// Rutas de usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await query(
      'SELECT id, email, nombre_completo, telefono, role, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json({ success: true, data: usuarios });
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre_completo, telefono, role } = req.body;
    
    // Verificar si el email ya existe (excluyendo el usuario actual)
    const [existingUsers]: any = await query(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El correo electrónico ya está registrado' 
      });
    }

    await query(
      `UPDATE usuarios 
       SET email = ?, 
           nombre_completo = ?, 
           telefono = ?,
           role = ?
       WHERE id = ?`,
      [email, nombre_completo, telefono, role, id]
    );

    const [updatedUser] = await query(
      'SELECT id, email, nombre_completo, telefono, role, created_at FROM usuarios WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/usuarios/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user'].includes(role)) {
      throw new Error('Rol inválido');
    }

    await query('UPDATE usuarios SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error al actualizar rol:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Rutas de instalaciones
app.get('/api/instalaciones', async (req, res) => {
  try {
    const instalaciones = await getInstalacionesFromDB();
    res.json({ success: true, data: instalaciones });
  } catch (error: any) {
    console.error('Error al obtener instalaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/instalaciones', async (req, res) => {
  try {
    const nuevaInstalacion = await createInstalacionInDB(req.body);
    res.json({ success: true, data: nuevaInstalacion });
  } catch (error: any) {
    console.error('Error al crear instalación:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/instalaciones/:id', async (req, res) => {
  try {
    const instalacion = await updateInstalacionInDB(req.params.id, req.body);
    res.json({ success: true, data: instalacion });
  } catch (error: any) {
    console.error('Error al actualizar instalación:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/instalaciones/:id', async (req, res) => {
  try {
    await deleteInstalacionFromDB(req.params.id);
    res.json({ success: true, message: 'Instalación eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar instalación:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Ruta para mantenimiento instalaciones
app.post('/api/mantenimiento', async (req, res) => {
  try {
    const { instalacion_id, hora_inicio, hora_fin, descripcion } = req.body;

    // Validar que no haya reservas en ese horario
    const reservasExistentes = await query(
      `SELECT * FROM reservas 
       WHERE instalacion_id = ? 
       AND estado = 'confirmada'
       AND (
         (hora_inicio BETWEEN ? AND ?) OR
         (hora_fin BETWEEN ? AND ?) OR
         (hora_inicio <= ? AND hora_fin >= ?)
       )`,
      [instalacion_id, hora_inicio, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_fin]
    );

    if (Array.isArray(reservasExistentes) && reservasExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Existen reservas confirmadas en ese horario'
      });
    }

    // Insertar el mantenimiento
    await query(
      `INSERT INTO mantenimiento (
        id, instalacion_id, hora_inicio, hora_fin, descripcion
      ) VALUES (UUID(), ?, ?, ?, ?)`,
      [instalacion_id, hora_inicio, hora_fin, descripcion]
    );

    res.json({ 
      success: true, 
      message: 'Mantenimiento programado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al programar mantenimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener mantenimiento activo de una instalación
app.get('/api/mantenimiento/:instalacionId', async (req, res) => {
  try {
    const { instalacionId } = req.params;
    const [mantenimiento] = await query(
      `SELECT * FROM mantenimiento 
       WHERE instalacion_id = ? 
       AND hora_fin > NOW()
       ORDER BY hora_inicio ASC
       LIMIT 1`,
      [instalacionId]
    );

    res.json({ success: true, data: mantenimiento || null });
  } catch (error: any) {
    console.error('Error al obtener mantenimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para finalizar mantenimiento
app.put('/api/mantenimiento/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Actualizar la hora de fin al momento actual
    await query(
      'UPDATE mantenimiento SET hora_fin = ? WHERE id = ?',
      [now, id]
    );

    // Obtener la instalación asociada para verificar su estado
    const [mantenimiento]: any = await query(
      'SELECT instalacion_id FROM mantenimiento WHERE id = ?',
      [id]
    );

    if (mantenimiento) {
      // Verificar si hay más mantenimientos activos para esta instalación
      const [mantenimientosActivos]: any = await query(
        `SELECT COUNT(*) as count 
         FROM mantenimiento 
         WHERE instalacion_id = ? 
         AND hora_fin > NOW()
         AND id != ?`,
        [mantenimiento.instalacion_id, id]
      );

      // Si no hay más mantenimientos activos, la instalación estará disponible
      if (mantenimientosActivos.count === 0) {
        // No necesitamos actualizar explícitamente el estado ya que se maneja a través de la vista
        console.log('Instalación disponible para su uso');
      }
    }

    res.json({ 
      success: true, 
      message: 'Mantenimiento finalizado exitosamente',
      hora_fin: now
    });
  } catch (error: any) {
    console.error('Error al finalizar mantenimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rutas de reservas
app.get('/api/reservas', async (req, res) => {
  try {
    const { instalacion_id, fecha } = req.query;
    let sql = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];

    if (instalacion_id) {
      sql += ' AND instalacion_id = ?';
      params.push(instalacion_id);
    }

    if (fecha) {
      sql += ' AND DATE(hora_inicio) = DATE(?)';
      params.push(fecha);
    }

    sql += ' AND estado = "confirmada"';
    sql += ' ORDER BY hora_inicio';

    const reservas = await query(sql, params);
    res.json({ success: true, data: reservas });
  } catch (error: any) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener reservas (admin)
app.get('/api/reservas/admin', async (req, res) => {
  try {
    const { estado, mes, año, fecha, fechaInicio, fechaFin } = req.query;
    let sql = `
      SELECT r.*, 
             i.nombre as instalacion_nombre,
             u.nombre_completo as usuario_nombre
      FROM reservas r
      JOIN instalaciones i ON r.instalacion_id = i.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filtro por estado
    if (estado && estado !== 'todos') {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }

    // Filtros de fecha
    if (mes) {
      sql += ' AND DATE_FORMAT(r.hora_inicio, "%Y-%m") = ?';
      params.push(mes);
    } else if (año) {
      sql += ' AND YEAR(r.hora_inicio) = ?';
      params.push(año);
    } else if (fecha) {
      sql += ' AND DATE(r.hora_inicio) = ?';
      params.push(fecha);
    } else if (fechaInicio && fechaFin) {
      sql += ' AND DATE(r.hora_inicio) BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }

    sql += ' ORDER BY r.hora_inicio DESC';

    console.log('SQL Query:', sql); // Para debugging
    console.log('Parameters:', params); // Para debugging

    const reservas = await query(sql, params);
    res.json({ success: true, data: reservas });
  } catch (error: any) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reservas', async (req, res) => {
  try {
    const { instalacion_id, usuario_id, hora_inicio, hora_fin, estado } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!instalacion_id || !usuario_id || !hora_inicio || !hora_fin || !estado) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos los campos son requeridos: instalacion_id, usuario_id, hora_inicio, hora_fin, estado' 
      });
    }

    // Verificar si ya existe una reserva para ese horario
    const reservasExistentes = await query(
      `SELECT * FROM reservas 
       WHERE instalacion_id = ? 
       AND estado = 'confirmada'
       AND (
         (hora_inicio BETWEEN ? AND ?) OR
         (hora_fin BETWEEN ? AND ?) OR
         (hora_inicio <= ? AND hora_fin >= ?)
       )`,
      [instalacion_id, hora_inicio, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_fin]
    );

    if (Array.isArray(reservasExistentes) && reservasExistentes.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya existe una reserva para este horario' 
      });
    }

    // Obtener el precio por hora de la instalación
    const [instalacion]: any = await query(
      'SELECT precio_por_hora FROM instalaciones WHERE id = ?',
      [instalacion_id]
    );

    if (!instalacion) {
      return res.status(400).json({
        success: false,
        error: 'Instalación no encontrada'
      });
    }

    // Calcular el precio total
    const horaInicio = new Date(hora_inicio);
    const horaFin = new Date(hora_fin);
    const horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
    const precio_total = Math.round(horas * instalacion.precio_por_hora * 100) / 100;

    // Crear la reserva
    const result = await query(
      `INSERT INTO reservas (
        id, instalacion_id, usuario_id, hora_inicio, 
        hora_fin, estado, precio_total
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [instalacion_id, usuario_id, hora_inicio, hora_fin, estado, precio_total]
    );

    // Obtener la reserva creada
    const [reservaCreada] = await query(
      `SELECT r.*, 
              i.nombre as instalacion_nombre,
              u.nombre_completo as usuario_nombre
       FROM reservas r
       JOIN instalaciones i ON r.instalacion_id = i.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = LAST_INSERT_ID()`,
    );

    res.json({ 
      success: true, 
      message: 'Reserva creada exitosamente',
      data: reservaCreada
    });
  } catch (error: any) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nuevo endpoint para actualizar reservas
app.put('/api/reservas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { instalacion_id, usuario_id, hora_inicio, hora_fin, estado } = req.body;

    // Verificar si ya existe una reserva para ese horario (excluyendo la reserva actual)
    const reservasExistentes = await query(
      `SELECT * FROM reservas 
       WHERE instalacion_id = ? 
       AND id != ?
       AND estado = 'confirmada'
       AND (
         (hora_inicio BETWEEN ? AND ?) OR
         (hora_fin BETWEEN ? AND ?) OR
         (hora_inicio <= ? AND hora_fin >= ?)
       )`,
      [instalacion_id, id, hora_inicio, hora_fin, hora_inicio, hora_fin, hora_inicio, hora_fin]
    );

    if (Array.isArray(reservasExistentes) && reservasExistentes.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya existe una reserva para este horario' 
      });
    }

    // Calcular precio total
    const [instalacion]: any = await query(
      'SELECT precio_por_hora FROM instalaciones WHERE id = ?',
      [instalacion_id]
    );

    const horaInicio = new Date(hora_inicio);
    const horaFin = new Date(hora_fin);
    const horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
    const precio_total = Math.round(horas * instalacion.precio_por_hora * 100) / 100;

    // Actualizar la reserva
    await query(
      `UPDATE reservas 
       SET instalacion_id = ?,
           usuario_id = ?,
           hora_inicio = ?,
           hora_fin = ?,
           estado = ?,
           precio_total = ?
       WHERE id = ?`,
      [instalacion_id, usuario_id, hora_inicio, hora_fin, estado, precio_total, id]
    );

    // Obtener la reserva actualizada
    const [reservaActualizada] = await query(
      `SELECT r.*, 
              i.nombre as instalacion_nombre,
              u.nombre_completo as usuario_nombre
       FROM reservas r
       JOIN instalaciones i ON r.instalacion_id = i.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({ success: true, data: reservaActualizada });
  } catch (error: any) {
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/reservas/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['pendiente', 'confirmada', 'cancelada'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    await query(
      'UPDATE reservas SET estado = ? WHERE id = ?',
      [estado, id]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error al actualizar estado de reserva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rutas para reportes
app.get('/api/reportes/mensual', async (req, res) => {
  try {
    const { fecha } = req.query;
    const primerDiaMes = `${fecha}-01`;
    const ultimoDiaMes = new Date(Number(fecha?.toString().split('-')[0]), Number(fecha?.toString().split('-')[1]), 0).toISOString().split('T')[0];

    // Obtener estadísticas mensuales
    const [stats]: any = await query(`
      SELECT 
        COUNT(*) as total_reservas,
        SUM(precio_total) as ingresos_totales,
        (
          SELECT i.nombre
          FROM reservas r2
          JOIN instalaciones i ON r2.instalacion_id = i.id
          WHERE DATE(r2.hora_inicio) BETWEEN ? AND ?
          GROUP BY r2.instalacion_id
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as instalacion_mas_reservada,
        ROUND(
          (
            SELECT COUNT(*) * 100.0 / (
              SELECT COUNT(*)
              FROM horarios_instalaciones hi
              CROSS JOIN (
                SELECT DISTINCT DATE(hora_inicio) as fecha
                FROM reservas
                WHERE DATE(hora_inicio) BETWEEN ? AND ?
              ) d
            )
            FROM reservas
            WHERE estado = 'confirmada'
            AND DATE(hora_inicio) BETWEEN ? AND ?
          )
        ) as porcentaje_ocupacion
      FROM reservas
      WHERE estado = 'confirmada'
      AND DATE(hora_inicio) BETWEEN ? AND ?
    `, [primerDiaMes, ultimoDiaMes, primerDiaMes, ultimoDiaMes, primerDiaMes, ultimoDiaMes, primerDiaMes, ultimoDiaMes]);

    res.json({
      success: true,
      data: {
        mes: fecha,
        total_reservas: stats.total_reservas || 0,
        ingresos_totales: stats.ingresos_totales || 0,
        instalacion_mas_reservada: stats.instalacion_mas_reservada || 'Sin reservas',
        porcentaje_ocupacion: stats.porcentaje_ocupacion || 0
      }
    });
  } catch (error: any) {
    console.error('Error al obtener reporte mensual:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reportes/instalaciones', async (req, res) => {
  try {
    const { fecha } = req.query;
    const primerDiaMes = `${fecha}-01`;
    const ultimoDiaMes = new Date(Number(fecha?.toString().split('-')[0]), Number(fecha?.toString().split('-')[1]), 0).toISOString().split('T')[0];

    const reportes = await query(`
      SELECT 
        i.nombre as instalacion,
        COUNT(r.id) as total_reservas,
        COALESCE(SUM(r.precio_total), 0) as ingresos,
        COALESCE(SUM(TIMESTAMPDIFF(HOUR, r.hora_inicio, r.hora_fin)), 0) as horas_ocupadas,
        ROUND(
          COUNT(r.id) * 100.0 / (
            SELECT COUNT(*)
            FROM horarios_instalaciones hi
            WHERE hi.instalacion_id = i.id
          )
        ) as porcentaje_ocupacion
      FROM instalaciones i
      LEFT JOIN reservas r ON i.id = r.instalacion_id
        AND r.estado = 'confirmada'
        AND DATE(r.hora_inicio) BETWEEN ? AND ?
      GROUP BY i.id, i.nombre
      ORDER BY total_reservas DESC
    `, [primerDiaMes, ultimoDiaMes]);

    res.json({ success: true, data: reportes });
  } catch (error: any) {
    console.error('Error al obtener reporte por instalación:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener disponibilidad
app.get('/api/disponibilidad', async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha || typeof fecha !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere una fecha válida en formato YYYY-MM-DD' 
      });
    }

    const disponibilidad = await getDisponibilidadInstalaciones(fecha);
    res.json({ success: true, data: disponibilidad });
  } catch (error: any) {
    console.error('Error al obtener disponibilidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Ruta para obtener estadísticas del dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Obtener mes actual y mes anterior
    const hoy = new Date();
    const mesActual = hoy.toISOString().slice(0, 7);
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1).toISOString().slice(0, 7);

    // Estadísticas del mes actual
    const [statsActual]: any = await query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_reservas,
        COUNT(DISTINCT CASE 
          WHEN r.hora_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id 
          END) as usuarios_activos,
        COALESCE(SUM(r.precio_total), 0) as ingresos_mensuales
      FROM usuarios u
      LEFT JOIN reservas r ON u.id = r.usuario_id 
        AND DATE_FORMAT(r.hora_inicio, '%Y-%m') = ?
      WHERE u.role = 'user'
    `, [mesActual]);

    // Estadísticas del mes anterior
    const [statsAnterior]: any = await query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_reservas,
        COUNT(DISTINCT CASE 
          WHEN r.hora_inicio >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 30 DAY)
          AND r.hora_inicio < DATE_SUB(NOW(), INTERVAL 1 MONTH)
          THEN u.id 
          END) as usuarios_activos,
        COALESCE(SUM(r.precio_total), 0) as ingresos_mensuales
      FROM usuarios u
      LEFT JOIN reservas r ON u.id = r.usuario_id 
        AND DATE_FORMAT(r.hora_inicio, '%Y-%m') = ?
      WHERE u.role = 'user'
    `, [mesAnterior]);

    // Calcular cambios porcentuales
    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return '+100%';
      const cambio = ((actual - anterior) / anterior) * 100;
      return `${cambio >= 0 ? '+' : ''}${cambio.toFixed(1)}%`;
    };

    const stats = {
      total_reservas: statsActual.total_reservas || 0,
      usuarios_activos: statsActual.usuarios_activos || 0,
      ingresos_mensuales: statsActual.ingresos_mensuales || 0,
      cambio_reservas: calcularCambio(
        statsActual.total_reservas || 0,
        statsAnterior.total_reservas || 0
      ),
      cambio_usuarios: calcularCambio(
        statsActual.usuarios_activos || 0,
        statsAnterior.usuarios_activos || 0
      ),
      cambio_ingresos: calcularCambio(
        statsActual.ingresos_mensuales || 0,
        statsAnterior.ingresos_mensuales || 0
      )
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});