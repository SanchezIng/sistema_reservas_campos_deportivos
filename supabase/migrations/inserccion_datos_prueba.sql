-- Insercones de Datos de Prueba


-- 4 Inserccion Datos de prueba
-- Inserción de usuarios
INSERT INTO usuarios (id, email, nombre_completo, telefono, password_hash, role) VALUES
(UUID(), 'juan.perez@email.com', 'Juan Pérez', '+34600111222', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user'),
(UUID(), 'maria.garcia@email.com', 'María García', '+34600222333', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user'),
(UUID(), 'carlos.rodriguez@email.com', 'Carlos Rodríguez', '+34600444555', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user'),
(UUID(), 'ana.martinez@email.com', 'Ana Martínez', '+34600555666', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user'),
(UUID(), 'pedro.sanchez@email.com', 'Pedro Sánchez', '+34600666777', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user'),
(UUID(), 'lucia.fernandez@email.com', 'Lucía Fernández', '+34600777888', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuWfoBPPIGMZOCi', 'user');

-- Inserción de instalaciones deportivas
INSERT INTO instalaciones (id, nombre, tipo, superficie, descripcion, precio_por_hora, imagen_url) VALUES
(UUID(), 'Campo Principal - Césped Natural', 'soccer', 'cesped', 'Campo de fútbol profesional con césped natural de primera calidad', 120, 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Campo 2 - Césped Sintético', 'soccer', 'concreto', 'Campo de fútbol con césped sintético de última generación', 100, 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Cancha de Básquet Cubierta', 'basketball', 'concreto', 'Cancha de básquet techada con piso premium', 80, 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Piscina Semiolímpica', 'swimming', NULL, 'Piscina semiolímpica con temperatura controlada', 150, 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Cancha de Volleyball Exterior', 'volleyball', 'concreto', 'Cancha de volleyball al aire libre con piso de concreto', 70, 'https://images.unsplash.com/photo-1533653114-051740bf97f0?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Piscina Olímpica', 'swimming', 'concreto', 'Piscina olímpica con temperatura controlada para entrenamientos', 200, 'https://images.unsplash.com/photo-1524257785277-e57e0a47fbb6?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Campo de Fútbol 5 - Césped Sintético', 'soccer', 'cesped', 'Campo de fútbol 5 con césped sintético de alta calidad', 80, 'https://images.unsplash.com/photo-1573053362441-e9071221cb88?auto=format&fit=crop&q=80&w=800'),
(UUID(), 'Cancha de Básquet Exterior', 'basketball', 'concreto', 'Cancha de básquet al aire libre con piso de concreto resistente', 60, 'https://images.unsplash.com/photo-1580484327323-217fbadd2bdb?auto=format&fit=crop&q=80&w=800');

-- Inserción de horarios para todas las instalaciones
INSERT INTO horarios_instalaciones (id, instalacion_id, dia_semana, hora_apertura, hora_cierre)
SELECT 
    UUID(), 
    id, 
    dia.dia_semana, 
    CASE 
        WHEN dia.dia_semana IN (0) THEN '08:00'
        WHEN dia.dia_semana IN (6) THEN '07:00'
        ELSE '06:00'
    END,
    CASE 
        WHEN dia.dia_semana IN (0) THEN '20:00'
        WHEN dia.dia_semana IN (6) THEN '21:00'
        ELSE '22:00'
    END
FROM instalaciones 
CROSS JOIN (
    SELECT 0 as dia_semana UNION ALL
    SELECT 1 UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5 UNION ALL
    SELECT 6
) as dia;

-- Obtener IDs específicos para las relaciones
SET @usuario1 = (SELECT id FROM usuarios WHERE email = 'juan.perez@email.com');
SET @usuario2 = (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com');
SET @usuario3 = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com');
SET @usuario4 = (SELECT id FROM usuarios WHERE email = 'ana.martinez@email.com');
SET @usuario5 = (SELECT id FROM usuarios WHERE email = 'pedro.sanchez@email.com');
SET @usuario6 = (SELECT id FROM usuarios WHERE email = 'lucia.fernandez@email.com');

SET @instalacion1 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Campo Principal%');
SET @instalacion2 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Cancha de Básquet Cubierta%');
SET @instalacion3 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Piscina Semi%');
SET @instalacion4 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Volleyball%');
SET @instalacion5 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Piscina Olímpica%');
SET @instalacion6 = (SELECT id FROM instalaciones WHERE nombre LIKE '%Fútbol 5%');

-- Inserción de reservas
INSERT INTO reservas (id, instalacion_id, usuario_id, hora_inicio, hora_fin, estado, precio_total) VALUES
(UUID(), @instalacion1, @usuario1, '2025-02-15 10:00:00', '2025-02-15 12:00:00', 'confirmada', 240.00),
(UUID(), @instalacion2, @usuario2, '2025-02-15 14:00:00', '2025-02-15 16:00:00', 'pendiente', 160.00),
(UUID(), @instalacion3, @usuario3, '2025-02-16 09:00:00', '2025-02-16 11:00:00', 'confirmada', 300.00),
(UUID(), @instalacion4, @usuario4, '2025-02-16 16:00:00', '2025-02-16 18:00:00', 'confirmada', 140.00),
(UUID(), @instalacion1, @usuario2, '2025-02-17 11:00:00', '2025-02-17 13:00:00', 'pendiente', 240.00),
(UUID(), @instalacion5, @usuario5, '2025-02-17 14:00:00', '2025-02-17 16:00:00', 'confirmada', 400.00),
(UUID(), @instalacion6, @usuario6, '2025-02-18 09:00:00', '2025-02-18 11:00:00', 'pendiente', 160.00),
(UUID(), @instalacion2, @usuario1, '2025-02-18 16:00:00', '2025-02-18 18:00:00', 'cancelada', 160.00);

-- Inserción de mantenimiento
INSERT INTO mantenimiento (id, instalacion_id, hora_inicio, hora_fin, descripcion) VALUES
(UUID(), @instalacion1, '2025-02-01 08:00:00', '2025-02-01 12:00:00', 'Mantenimiento preventivo de césped'),
(UUID(), @instalacion2, '2025-02-01 08:00:00', '2025-02-01 12:00:00', 'Reemplazo de balones y redes de básquet'),
(UUID(), @instalacion3, '2025-02-02 08:00:00', '2025-02-02 14:00:00', 'Limpieza profunda y mantenimiento de filtros'),
(UUID(), @instalacion4, '2025-02-03 08:00:00', '2025-02-03 11:00:00', 'Mantenimiento de la red y líneas de la cancha'),
(UUID(), @instalacion5, '2025-02-04 07:00:00', '2025-02-04 15:00:00', 'Mantenimiento del sistema de climatización'),
(UUID(), @instalacion6, '2025-02-05 08:00:00', '2025-02-05 13:00:00', 'Reparación del césped sintético');