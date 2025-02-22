-- 1. Crear la base de datos
CREATE DATABASE IF NOT EXISTS db_reservas_deportivas;
USE db_reservas_deportivas;

-- 2. Creación de todas las tablas
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user',
  reset_token VARCHAR(255) NULL,
  reset_token_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de instalaciones
CREATE TABLE IF NOT EXISTS instalaciones (
  id VARCHAR(36) PRIMARY KEY ,
  nombre VARCHAR(255) NOT NULL,
  tipo ENUM('soccer', 'basketball', 'volleyball', 'swimming') NOT NULL,
  superficie ENUM('cesped', 'concreto'),
  descripcion TEXT,
  precio_por_hora DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de horarios de instalaciones
CREATE TABLE IF NOT EXISTS horarios_instalaciones (
  id VARCHAR(36) PRIMARY KEY ,
  instalacion_id VARCHAR(36) NOT NULL,
  dia_semana TINYINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_apertura TIME NOT NULL,
  hora_cierre TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id),
  CONSTRAINT horario_valido CHECK (hora_cierre > hora_apertura)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
  id VARCHAR(36) PRIMARY KEY ,
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

-- 3. Creación de índices
CREATE INDEX idx_reservas_instalacion ON reservas(instalacion_id);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_horarios_instalacion ON horarios_instalaciones(instalacion_id);
CREATE INDEX idx_mantenimiento_instalacion ON mantenimiento(instalacion_id);


-- Crear vista para el estado de las instalaciones
CREATE OR REPLACE VIEW v_estado_instalaciones AS
SELECT 
    i.id,
    i.nombre,
    i.tipo,
    i.superficie,
    i.descripcion,
    i.precio_por_hora,
    i.imagen_url,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM mantenimiento m 
            WHERE m.instalacion_id = i.id 
            AND CURRENT_TIMESTAMP BETWEEN m.hora_inicio AND m.hora_fin
        ) THEN 'mantenimiento'
        WHEN EXISTS (
            SELECT 1 FROM reservas r 
            WHERE r.instalacion_id = i.id 
            AND r.estado = 'confirmada'
            AND CURRENT_TIMESTAMP BETWEEN r.hora_inicio AND r.hora_fin
        ) THEN 'ocupado'
        WHEN EXISTS (
            SELECT 1 FROM horarios_instalaciones h 
            WHERE h.instalacion_id = i.id 
            AND h.dia_semana = WEEKDAY(CURRENT_TIMESTAMP)
            AND CURRENT_TIME BETWEEN h.hora_apertura AND h.hora_cierre
        ) THEN 'disponible'
        ELSE 'cerrado'
    END as estado,
    (
        SELECT MIN(r.hora_inicio)
        FROM reservas r
        WHERE r.instalacion_id = i.id 
        AND r.estado = 'confirmada'
        AND r.hora_inicio > CURRENT_TIMESTAMP
    ) as proxima_reserva,
    (
        SELECT MIN(m.hora_inicio)
        FROM mantenimiento m
        WHERE m.instalacion_id = i.id 
        AND m.hora_inicio > CURRENT_TIMESTAMP
    ) as proximo_mantenimiento FROM instalaciones i;

-- Ejemplo de uso de la vista
SELECT * FROM v_estado_instalaciones;