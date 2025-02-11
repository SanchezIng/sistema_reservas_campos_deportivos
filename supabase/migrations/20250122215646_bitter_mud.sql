-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS deporteya;
USE deporteya;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de instalaciones
CREATE TABLE IF NOT EXISTS instalaciones (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo ENUM('soccer', 'basketball', 'volleyball', 'swimming') NOT NULL,
  superficie ENUM('cesped', 'concreto'),
  descripcion TEXT,
  precio_por_hora DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
  id VARCHAR(36) PRIMARY KEY,
  instalacion_id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  hora_inicio DATETIME NOT NULL,
  hora_fin DATETIME NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  precio_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT hora_valida CHECK (hora_fin > hora_inicio)
);

-- Tabla de horarios de instalaciones
CREATE TABLE IF NOT EXISTS horarios_instalaciones (
  id VARCHAR(36) PRIMARY KEY,
  instalacion_id VARCHAR(36) NOT NULL,
  dia_semana TINYINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_apertura TIME NOT NULL,
  hora_cierre TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id),
  CONSTRAINT horario_valido CHECK (hora_cierre > hora_apertura)
);

-- Tabla de mantenimiento
CREATE TABLE IF NOT EXISTS mantenimiento (
  id VARCHAR(36) PRIMARY KEY,
  instalacion_id VARCHAR(36) NOT NULL,
  hora_inicio DATETIME NOT NULL,
  hora_fin DATETIME NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id),
  CONSTRAINT mantenimiento_valido CHECK (hora_fin > hora_inicio)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_reservas_instalacion ON reservas(instalacion_id);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_horarios_instalacion ON horarios_instalaciones(instalacion_id);
CREATE INDEX idx_mantenimiento_instalacion ON mantenimiento(instalacion_id);