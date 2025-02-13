import { query } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt';

export async function registerUser(userData: {
  email: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
}) {
  try {
    // Verificar si el email ya existe
    const [existingUsers]: any = await query(
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
    await query(
      'INSERT INTO usuarios (id, email, password_hash, nombre_completo, telefono, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, userData.email, passwordHash, userData.nombreCompleto, userData.telefono || null, 'user']
    );

    return {
      id: userId,
      email: userData.email,
      nombreCompleto: userData.nombreCompleto,
      role: 'user'
    };
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    // Buscar usuario por email
    const [user]: any = await query(
      'SELECT id, email, password_hash, nombre_completo, role FROM usuarios WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Contraseña incorrecta');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        nombreCompleto: user.nombre_completo,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombreCompleto: user.nombre_completo,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error en autenticación:', error);
    throw error;
  }
}