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
  origin: 'http://localhost:5173',
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

app.post('/api/reservas', async (req, res) => {
  try {
    const { instalacion_id, usuario_id, hora_inicio, hora_fin, estado, precio_total } = req.body;
    
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

    // Crear la reserva
    const result = await query(
      `INSERT INTO reservas (
        id, instalacion_id, usuario_id, hora_inicio, 
        hora_fin, estado, precio_total
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [instalacion_id, usuario_id, hora_inicio, hora_fin, estado, precio_total]
    );

    res.json({ 
      success: true, 
      message: 'Reserva creada exitosamente',
      data: result
    });
  } catch (error: any) {
    console.error('Error al crear reserva:', error);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});