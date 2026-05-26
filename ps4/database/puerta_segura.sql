
CREATE DATABASE IF NOT EXISTS puerta_segura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE puerta_segura;
 
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS auditoria, notificaciones, registros_acceso, estado_barrera, lista_negra, visitantes, vehiculos, usuarios;
SET FOREIGN_KEY_CHECKS = 1;
 
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'vigilante',
    access_point VARCHAR(100) NOT NULL DEFAULT 'Entrada Principal',
    phone VARCHAR(20) DEFAULT '',
    avatar_initials VARCHAR(3) DEFAULT '',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_staff TINYINT(1) NOT NULL DEFAULT 0,
    is_superuser TINYINT(1) NOT NULL DEFAULT 0,
    login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_activity DATETIME NULL,
    date_joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE vehiculos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Automovil',
    marca VARCHAR(60) DEFAULT '',
    modelo VARCHAR(60) DEFAULT '',
    color VARCHAR(40) DEFAULT '',
    propietario VARCHAR(200) NOT NULL,
    documento VARCHAR(30) DEFAULT '',
    correo VARCHAR(254) DEFAULT '',
    telefono VARCHAR(20) DEFAULT '',
    codigo_qr TEXT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    registrado_por_id BIGINT NULL,
    notas TEXT NULL,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_placa (placa),
    INDEX idx_activo (activo),
    INDEX idx_expira (expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE lista_negra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    razon VARCHAR(20) NOT NULL DEFAULT 'otro',
    motivo TEXT NOT NULL,
    agregado_por_id BIGINT NULL,
    agregado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (agregado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_placa (placa),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE registros_acceso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id BIGINT NULL,
    placa VARCHAR(10) NOT NULL,
    propietario VARCHAR(200) DEFAULT '',
    movimiento VARCHAR(20) NOT NULL,
    metodo VARCHAR(20) NOT NULL DEFAULT 'QR',
    punto_acceso VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    motivo_denegacion VARCHAR(300) DEFAULT '',
    registrado_por_id BIGINT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_placa_ts (placa, timestamp),
    INDEX idx_estado (estado),
    INDEX idx_timestamp (timestamp),
    INDEX idx_movimiento (movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE visitantes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    documento VARCHAR(30) DEFAULT '',
    placa VARCHAR(10) DEFAULT '',
    telefono VARCHAR(20) DEFAULT '',
    correo VARCHAR(254) DEFAULT '',
    anfitrion VARCHAR(200) DEFAULT '',
    dependencia VARCHAR(100) DEFAULT '',
    motivo TEXT NULL,
    hora_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_salida DATETIME NULL,
    registrado_por_id BIGINT NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_hora_entrada (hora_entrada),
    INDEX idx_hora_salida (hora_salida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE estado_barrera (
    id INT PRIMARY KEY DEFAULT 1,
    abierta TINYINT(1) NOT NULL DEFAULT 0,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por_id BIGINT NULL,
    razon VARCHAR(200) DEFAULT '',
    FOREIGN KEY (actualizado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    accion VARCHAR(30) NOT NULL,
    detalle TEXT NULL,
    ip_address VARCHAR(45) NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exitoso TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_accion (accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE notificaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'info',
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida TINYINT(1) NOT NULL DEFAULT 0,
    creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    placa VARCHAR(10) DEFAULT '',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_creada (creada_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE IF NOT EXISTS token_blacklist_outstandingtoken (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    token TEXT NOT NULL,
    created_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    jti VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE IF NOT EXISTS token_blacklist_blacklistedtoken (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id BIGINT NOT NULL UNIQUE,
    blacklisted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES token_blacklist_outstandingtoken(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
INSERT INTO estado_barrera (id, abierta, razon) VALUES (1, 0, 'Inicio del sistema') ON DUPLICATE KEY UPDATE id=id;
 
CREATE OR REPLACE VIEW v_accesos_por_dia AS
    SELECT DATE(timestamp) AS fecha, COUNT(*) AS total,
           SUM(estado='Autorizado') AS autorizados, SUM(estado='Denegado') AS denegados
    FROM registros_acceso GROUP BY DATE(timestamp) ORDER BY fecha DESC;
 
CREATE OR REPLACE VIEW v_vehiculos_estado AS
    SELECT v.id, v.placa, v.propietario, v.tipo, v.marca, v.color, v.activo,
           v.expira_en, DATEDIFF(v.expira_en, NOW()) AS dias_vigencia,
           IF(lb.id IS NOT NULL, 1, 0) AS en_lista_negra,
           lb.motivo AS motivo_bloqueo
    FROM vehiculos v LEFT JOIN lista_negra lb ON lb.placa=v.placa AND lb.activo=1;
 
DELIMITER ;;
DROP TRIGGER IF EXISTS trg_lista_negra_insert;;
CREATE TRIGGER trg_lista_negra_insert
AFTER INSERT ON lista_negra FOR EACH ROW
BEGIN
    INSERT INTO auditoria(accion, detalle, timestamp, exitoso)
    VALUES ('lista_negra_agregado', CONCAT('Placa ', NEW.placa, ': ', NEW.motivo), NOW(), 1);
END;;
DELIMITER ;
 
SELECT CONCAT('✅ Puerta Segura v3.0 — BD inicializada. Tablas: ', COUNT(*), ' · Vistas: 2 · Trigger: 1') AS resultado
FROM information_schema.tables WHERE table_schema='puerta_segura';