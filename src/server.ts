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

const app = express();

// Middleware
app.use(cors({
  origin: 'https://sistema-reservas-campos-deportivos.vercel.app/',
  credentials: true
}));
app.use(bodyParser.json());

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
    const { fecha, estado } = req.query;
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

    if (fecha) {
      sql += ' AND DATE(r.hora_inicio) = DATE(?)';
      params.push(fecha);
    }

    if (estado && estado !== 'todos') {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY r.hora_inicio DESC';

    const reservas = await query(sql, params);
    res.json({ success: true, data: reservas });
  } catch (error: any) {
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