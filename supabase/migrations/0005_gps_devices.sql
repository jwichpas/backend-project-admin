-- ============================================================================
-- SISTEMA DE GESTIÓN DE RUTAS Y SEGUIMIENTO EN TIEMPO REAL
-- ============================================================================
-- Autor: Claude Code Assistant
-- Fecha: 06/12/2024
-- Descripción: Tablas para gestión de rutas, paradas múltiples, alertas de tráfico y optimización de flotas

-- PASO 1: RUTAS BÁSICAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),

    estimated_fuel_consumption NUMERIC(8,2),
    actual_fuel_consumption NUMERIC(8,2),
    
    -- Información básica de la ruta
    route_name TEXT,
    route_type TEXT NOT NULL DEFAULT 'single_destination' 
        CHECK (route_type IN ('single_destination', 'multi_stop', 'optimized')),
    
    -- Coordenadas de origen y destino (para rutas simples)
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    
    -- Información del destinatario (para rutas simples)
    destination_party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    destination_name TEXT,
    
    -- Geometría de la ruta (coordenadas de la ruta completa)
    route_geometry JSONB, -- Array de coordenadas [[lng, lat], [lng, lat], ...]
    
    -- Métricas de la ruta
    total_distance_meters NUMERIC(12, 2) DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    estimated_cost NUMERIC(18, 6) DEFAULT 0,
    
    -- Estado y progreso
    status TEXT NOT NULL DEFAULT 'planned' 
        CHECK (status IN ('planned', 'active', 'completed', 'cancelled', 'paused')),
    progress_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Posición actual del vehículo en la ruta
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    remaining_distance_meters NUMERIC(12, 2) DEFAULT 0,
    remaining_time_seconds INTEGER DEFAULT 0,
    
    -- Tiempos de la ruta
    planned_start_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    estimated_arrival_time TIMESTAMPTZ,
    actual_completion_time TIMESTAMPTZ,
    
    -- Opciones de routing
    routing_profile TEXT DEFAULT 'driving-car' 
        CHECK (routing_profile IN ('driving-car', 'driving-hgv', 'cycling-regular', 'foot-walking')),
    routing_preference TEXT DEFAULT 'fastest' 
        CHECK (routing_preference IN ('fastest', 'shortest', 'recommended')),
    
    -- Configuraciones adicionales
    avoid_tolls BOOLEAN DEFAULT FALSE,
    avoid_highways BOOLEAN DEFAULT FALSE,
    avoid_ferries BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_routes_driver ON routes(driver_id, planned_start_time);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle ON routes(vehicle_id, planned_start_time);
CREATE INDEX IF NOT EXISTS idx_routes_status_date ON routes(status, planned_start_time);

CREATE TABLE IF NOT EXISTS device_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    
    -- Información de ubicación
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    accuracy_meters NUMERIC(8, 2),
    altitude_meters NUMERIC(8, 2),
    altitude_accuracy_meters NUMERIC(8, 2),
    heading_degrees NUMERIC(5, 2) CHECK (heading_degrees >= 0 AND heading_degrees < 360),
    speed_mps NUMERIC(6, 3), -- metros por segundo
    
    -- Metadatos del dispositivo
    device_info JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    platform TEXT,
    battery_level NUMERIC(3, 0) CHECK (battery_level >= 0 AND battery_level <= 100),
    is_online BOOLEAN DEFAULT TRUE,
    
    -- Fuente de datos
    source TEXT NOT NULL DEFAULT 'GPS' 
        CHECK (source IN ('GPS', 'NETWORK', 'MANUAL', 'ESTIMATED')),
    
    -- Contexto de la ubicación
    context TEXT CHECK (context IN ('WORK', 'ROUTE', 'BREAK', 'HOME', 'OTHER')),
    activity TEXT CHECK (activity IN ('DRIVING', 'WALKING', 'STATIONARY', 'UNKNOWN')),
    
    -- Información de sesión
    session_id UUID,
    app_version TEXT,
    
    -- Timestamps
    device_timestamp TIMESTAMPTZ NOT NULL, -- Timestamp del dispositivo
    server_timestamp TIMESTAMPTZ DEFAULT NOW(), -- Timestamp del servidor
    
    -- Índices geoespaciales
    location_point POINT GENERATED ALWAYS AS (POINT(longitude, latitude)) STORED
);

-- Índices para device_locations (tabla de alto volumen)
CREATE INDEX IF NOT EXISTS idx_device_locations_user_id ON device_locations(user_id, device_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_locations_device_id ON device_locations(device_id, device_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_locations_timestamp ON device_locations(device_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_locations_location ON device_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_device_locations_session ON device_locations(session_id, device_timestamp);
CREATE INDEX IF NOT EXISTS idx_device_locations_source ON device_locations(source, device_timestamp);

-- Índice geoespacial para consultas de proximidad
CREATE INDEX IF NOT EXISTS idx_device_locations_gist ON device_locations USING GIST(location_point);

-- PASO 11: DISPOSITIVOS REGISTRADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS registered_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Información del dispositivo
    device_name TEXT,
    device_type TEXT DEFAULT 'MOBILE' 
        CHECK (device_type IN ('MOBILE', 'TABLET', 'DESKTOP', 'GPS_TRACKER', 'OTHER')),
    
    -- Información del navegador/SO
    user_agent TEXT,
    platform TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Configuraciones de tracking
    tracking_enabled BOOLEAN DEFAULT FALSE,
    tracking_interval_seconds INTEGER DEFAULT 30 CHECK (tracking_interval_seconds > 0),
    high_accuracy_enabled BOOLEAN DEFAULT TRUE,
    background_tracking_enabled BOOLEAN DEFAULT FALSE,
    
    -- Permisos y configuraciones
    location_permission_granted BOOLEAN DEFAULT FALSE,
    notification_permission_granted BOOLEAN DEFAULT FALSE,
    
    -- Configuraciones de privacidad
    share_location BOOLEAN DEFAULT TRUE,
    track_when_app_closed BOOLEAN DEFAULT FALSE,
    
    -- Estado del dispositivo
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    last_location_latitude NUMERIC(10, 7),
    last_location_longitude NUMERIC(10, 7),
    last_location_accuracy NUMERIC(8, 2),
    last_location_timestamp TIMESTAMPTZ,
    
    -- Estadísticas de uso
    total_locations_sent INTEGER DEFAULT 0,
    first_location_sent_at TIMESTAMPTZ,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- PASO 12: SESIONES DE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    
    -- Información de la sesión
    session_name TEXT,
    session_type TEXT DEFAULT 'MANUAL' 
        CHECK (session_type IN ('MANUAL', 'AUTOMATIC', 'ROUTE_BASED', 'SCHEDULED')),
    
    -- Vinculación con rutas (opcional)
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Tiempos de la sesión
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN ended_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
            ELSE NULL 
        END
    ) STORED,
    
    -- Ubicaciones inicial y final
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    
    -- Estadísticas de la sesión
    total_distance_meters NUMERIC(12, 2) DEFAULT 0,
    max_speed_mps NUMERIC(6, 3) DEFAULT 0,
    avg_speed_mps NUMERIC(6, 3) DEFAULT 0,
    location_count INTEGER DEFAULT 0,
    
    -- Estado de la sesión
    status TEXT DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    
    -- Configuraciones
    tracking_interval_seconds INTEGER DEFAULT 30,
    high_accuracy_enabled BOOLEAN DEFAULT TRUE,
    
    -- Razón del tracking
    purpose TEXT,
    notes TEXT,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para tracking_sessions
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_user_id ON tracking_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_device_id ON tracking_sessions(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_route_id ON tracking_sessions(route_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status ON tracking_sessions(status, started_at);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_active ON tracking_sessions(status) WHERE status = 'ACTIVE';

-- PASO 13: FUNCIONES PARA TRACKING DE DISPOSITIVOS
-- ============================================================================

-- Función para actualizar estadísticas del dispositivo
CREATE OR REPLACE FUNCTION update_device_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar last_seen y ubicación en registered_devices
    UPDATE registered_devices SET 
        last_seen_at = NEW.server_timestamp,
        last_location_latitude = NEW.latitude,
        last_location_longitude = NEW.longitude,
        last_location_accuracy = NEW.accuracy_meters,
        last_location_timestamp = NEW.device_timestamp,
        total_locations_sent = total_locations_sent + 1,
        first_location_sent_at = COALESCE(first_location_sent_at, NEW.device_timestamp),
        updated_at = NOW()
    WHERE device_id = NEW.device_id;
    
    -- Si no existe el dispositivo, crearlo
    INSERT INTO registered_devices (device_id, user_id, last_seen_at, last_location_latitude, last_location_longitude, last_location_accuracy, last_location_timestamp, total_locations_sent, first_location_sent_at)
    SELECT NEW.device_id, NEW.user_id, NEW.server_timestamp, NEW.latitude, NEW.longitude, NEW.accuracy_meters, NEW.device_timestamp, 1, NEW.device_timestamp
    WHERE NOT EXISTS (SELECT 1 FROM registered_devices WHERE device_id = NEW.device_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas del dispositivo
CREATE TRIGGER update_device_stats_trigger
    AFTER INSERT ON device_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_device_stats();

-- Función para calcular estadísticas de sesiones de tracking
CREATE OR REPLACE FUNCTION calculate_session_stats()
RETURNS TRIGGER AS $$
DECLARE
    session_record tracking_sessions%ROWTYPE;
    prev_location device_locations%ROWTYPE;
    distance_delta NUMERIC;
    speed NUMERIC;
BEGIN
    -- Obtener información de la sesión si existe
    SELECT * INTO session_record 
    FROM tracking_sessions 
    WHERE id = NEW.session_id AND status = 'ACTIVE'
    LIMIT 1;
    
    IF FOUND THEN
        -- Obtener la ubicación anterior para calcular distancia
        SELECT * INTO prev_location
        FROM device_locations
        WHERE session_id = NEW.session_id 
          AND device_timestamp < NEW.device_timestamp
        ORDER BY device_timestamp DESC
        LIMIT 1;
        
        IF FOUND THEN
            -- Calcular distancia desde la ubicación anterior
            distance_delta := calculate_distance_km(
                prev_location.latitude, prev_location.longitude,
                NEW.latitude, NEW.longitude
            ) * 1000; -- Convertir a metros
            
            -- Calcular velocidad si tenemos speed en m/s
            IF NEW.speed_mps IS NOT NULL THEN
                speed := NEW.speed_mps;
            END IF;
            
            -- Actualizar estadísticas de la sesión
            UPDATE tracking_sessions SET
                total_distance_meters = COALESCE(total_distance_meters, 0) + COALESCE(distance_delta, 0),
                max_speed_mps = GREATEST(COALESCE(max_speed_mps, 0), COALESCE(speed, 0)),
                location_count = COALESCE(location_count, 0) + 1,
                end_latitude = NEW.latitude,
                end_longitude = NEW.longitude
            WHERE id = NEW.session_id;
            
        ELSE
            -- Primera ubicación de la sesión
            UPDATE tracking_sessions SET
                start_latitude = NEW.latitude,
                start_longitude = NEW.longitude,
                location_count = 1
            WHERE id = NEW.session_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular estadísticas de sesiones
CREATE TRIGGER calculate_session_stats_trigger
    AFTER INSERT ON device_locations
    FOR EACH ROW
    WHEN (NEW.session_id IS NOT NULL)
    EXECUTE FUNCTION calculate_session_stats();

-- PASO 14: VISTAS PARA TRACKING DE DISPOSITIVOS
-- ============================================================================

-- Vista para ubicaciones recientes de dispositivos
CREATE OR REPLACE VIEW recent_device_locations AS
SELECT DISTINCT ON (device_id)
    dl.device_id,
    dl.user_id,
    dl.latitude,
    dl.longitude,
    dl.accuracy_meters,
    dl.device_timestamp,
    dl.server_timestamp,
    dl.source,
    dl.battery_level,
    dl.is_online,
    rd.device_name,
    rd.device_type,
    rd.tracking_enabled
FROM device_locations dl
LEFT JOIN registered_devices rd ON dl.device_id = rd.device_id
ORDER BY device_id, device_timestamp DESC;

-- Vista para sesiones de tracking activas
CREATE OR REPLACE VIEW active_tracking_sessions AS
SELECT 
    ts.*,
    rd.device_name,
    rd.device_type,
    u.email as user_email,
    EXTRACT(EPOCH FROM (NOW() - ts.started_at))::INTEGER as elapsed_seconds
FROM tracking_sessions ts
LEFT JOIN registered_devices rd ON ts.device_id = rd.device_id
LEFT JOIN auth.users u ON ts.user_id = u.id
WHERE ts.status = 'ACTIVE';