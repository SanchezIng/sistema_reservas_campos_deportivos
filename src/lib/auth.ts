import { query, transaction } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt';

export async function authenticateUser(email: string, password: string) {
  try {
    // Buscar usuario por email
    const results: any = await query(
      'SELECT id, email, password_hash, nombre_completo FROM usuarios WHERE email = ?',
      [email]
    );

    console.log('Resultados de la consulta:', results); // Debug

    // Verificar si hay resultados
    if (!results || results.length === 0) {
      console.log('No se encontró el usuario'); // Debug
      throw new Error('Usuario no encontrado');
    }

    const user = results[0];
    console.log('Usuario encontrado:', { ...user, password_hash: '[PROTECTED]' }); // Debug

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Resultado de la comparación de contraseñas:', isValid); // Debug

    if (!isValid) {
      throw new Error('Contraseña incorrecta');
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        nombreCompleto: user.nombre_completo
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombreCompleto: user.nombre_completo
      }
    };
  } catch (error) {
    console.error('Error detallado en la autenticación:', error);
    throw error;
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
}) {
  return transaction(async (connection) => {
    // Verificar si el email ya existe
    const [existingUsers]: any = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [userData.email]
    );

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('El correo electrónico ya está registrado');
    }

    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Insertar nuevo usuario
    const userId = uuidv4();
    await connection.execute(
      'INSERT INTO usuarios (id, email, password_hash, nombre_completo, telefono) VALUES (?, ?, ?, ?, ?)',
      [userId, userData.email, passwordHash, userData.nombreCompleto, userData.telefono || null]
    );

    return {
      id: userId,
      email: userData.email,
      nombreCompleto: userData.nombreCompleto
    };
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
}