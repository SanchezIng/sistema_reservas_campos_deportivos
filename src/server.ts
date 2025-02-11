import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { registerUser, authenticateUser } from './lib/auth';
import { testConnection } from './lib/db';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Ajusta esto según tu puerto de desarrollo
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
    console.log('Datos de registro recibidos:', { email, nombreCompleto, telefono }); // Debug
    const user = await registerUser({ email, password, nombreCompleto, telefono });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error en registro:', error); // Debug
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Intento de login para:', email); // Debug
    const result = await authenticateUser(email, password);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error en login:', error); // Debug
    res.status(401).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});