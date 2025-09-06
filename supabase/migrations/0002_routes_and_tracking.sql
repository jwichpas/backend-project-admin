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

-- Índices para la tabla routes
CREATE INDEX IF NOT EXISTS idx_routes_company_id ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_destination_party ON routes(destination_party_id);
CREATE INDEX IF NOT EXISTS idx_routes_planned_start ON routes(planned_start_time);
CREATE INDEX IF NOT EXISTS idx_routes_location ON routes(current_latitude, current_longitude);

-- Trigger para updated_at
CREATE TRIGGER update_routes_updated_at 
    BEFORE UPDATE ON routes 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 2: PARADAS MÚLTIPLES PARA RUTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    
    -- Información de la parada
    stop_sequence INTEGER NOT NULL, -- Orden de la parada en la ruta
    stop_name TEXT NOT NULL,
    stop_type TEXT NOT NULL DEFAULT 'delivery' 
        CHECK (stop_type IN ('pickup', 'delivery', 'waypoint', 'service')),
    
    -- Ubicación de la parada
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT,
    
    -- Referencia a cliente/proveedor si aplica
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    
    -- Tiempos de la parada
    planned_arrival_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    planned_departure_time TIMESTAMPTZ,
    actual_departure_time TIMESTAMPTZ,
    service_time_minutes INTEGER DEFAULT 15, -- Tiempo estimado de servicio
    
    -- Ventana de tiempo (restricciones de horario)
    time_window_start TIME,
    time_window_end TIME,
    
    -- Estado de la parada
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'skipped', 'failed')),
    completion_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Prioridad y configuraciones
    priority INTEGER DEFAULT 1 CHECK (priority >= 1),
    is_mandatory BOOLEAN DEFAULT TRUE,
    allow_partial_completion BOOLEAN DEFAULT FALSE,
    
    -- Información de carga (para pickup/delivery)
    items_to_pickup JSONB DEFAULT '[]'::jsonb,
    items_to_deliver JSONB DEFAULT '[]'::jsonb,
    weight_kg NUMERIC(10, 3) DEFAULT 0,
    volume_m3 NUMERIC(10, 3) DEFAULT 0,
    
    -- Instrucciones y notas
    special_instructions TEXT,
    notes TEXT,
    completion_notes TEXT,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para route_stops
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_sequence ON route_stops(route_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_route_stops_status ON route_stops(status);
CREATE INDEX IF NOT EXISTS idx_route_stops_party ON route_stops(party_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_location ON route_stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_route_stops_planned_arrival ON route_stops(planned_arrival_time);

-- Constrainst de unicidad para el orden de paradas
ALTER TABLE route_stops ADD CONSTRAINT unique_route_stop_sequence UNIQUE (route_id, stop_sequence);

-- Trigger para updated_at
CREATE TRIGGER update_route_stops_updated_at 
    BEFORE UPDATE ON route_stops 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 3: ALERTAS DE TRÁFICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS traffic_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Puede ser global
    
    -- Información básica de la alerta
    alert_type TEXT NOT NULL 
        CHECK (alert_type IN ('accident', 'construction', 'congestion', 'closure', 'weather', 'event', 'other')),
    severity TEXT NOT NULL DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Ubicación de la alerta
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    affected_radius_meters INTEGER DEFAULT 500 CHECK (affected_radius_meters > 0),
    
    -- Área afectada (polígono opcional para alertas más complejas)
    affected_area_polygon JSONB, -- GeoJSON polygon si se necesita precisión
    
    -- Direccionalidad (si la alerta afecta solo una dirección)
    affects_direction BOOLEAN DEFAULT FALSE,
    direction_bearing NUMERIC(5, 2) CHECK (direction_bearing >= 0 AND direction_bearing < 360),
    
    -- Vigencia de la alerta
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Impacto estimado
    estimated_delay_minutes INTEGER DEFAULT 0,
    suggests_detour BOOLEAN DEFAULT FALSE,
    
    -- Información adicional
    source TEXT, -- 'USER', 'SYSTEM', 'EXTERNAL_API', 'TRAFFIC_SERVICE'
    source_url TEXT,
    external_id TEXT,
    
    -- Configuraciones
    auto_notify_routes BOOLEAN DEFAULT TRUE,
    notification_radius_meters INTEGER DEFAULT 1000,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Índices para traffic_alerts
CREATE INDEX IF NOT EXISTS idx_traffic_alerts_location ON traffic_alerts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_traffic_alerts_active ON traffic_alerts(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_traffic_alerts_type_severity ON traffic_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_traffic_alerts_valid_period ON traffic_alerts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_traffic_alerts_company ON traffic_alerts(company_id);

-- Trigger para updated_at
CREATE TRIGGER update_traffic_alerts_updated_at 
    BEFORE UPDATE ON traffic_alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 4: HISTORIAL DE RUTAS Y SEGUIMIENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Posición en el momento del tracking
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    altitude_meters NUMERIC(8, 2),
    
    -- Datos del vehículo
    speed_kph NUMERIC(6, 2) DEFAULT 0,
    heading_degrees NUMERIC(5, 2) CHECK (heading_degrees >= 0 AND heading_degrees < 360),
    
    -- Progreso de la ruta
    progress_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    distance_traveled_meters NUMERIC(12, 2) DEFAULT 0,
    distance_remaining_meters NUMERIC(12, 2) DEFAULT 0,
    
    -- Estado en ese momento
    vehicle_status TEXT CHECK (vehicle_status IN ('active', 'idle', 'stopped', 'maintenance')),
    route_status TEXT CHECK (route_status IN ('planned', 'active', 'completed', 'cancelled', 'paused')),
    
    -- Parada actual (si aplica)
    current_stop_id UUID REFERENCES route_stops(id) ON DELETE SET NULL,
    next_stop_id UUID REFERENCES route_stops(id) ON DELETE SET NULL,
    
    -- Tiempos estimados
    estimated_arrival_time TIMESTAMPTZ,
    
    -- Eventos especiales
    event_type TEXT, -- 'START', 'STOP_ARRIVAL', 'STOP_DEPARTURE', 'DEVIATION', 'TRAFFIC_ALERT', 'MANUAL_UPDATE'
    deviation_meters NUMERIC(8, 2),
    
    -- Metadatos del tracking
    gps_accuracy_meters NUMERIC(6, 2),
    data_source TEXT DEFAULT 'GPS', -- 'GPS', 'MANUAL', 'ESTIMATED'
    battery_level NUMERIC(3, 0) CHECK (battery_level >= 0 AND battery_level <= 100),
    
    -- Timestamp del reporte
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para route_tracking_history (tabla de alto volumen)
CREATE INDEX IF NOT EXISTS idx_route_tracking_route_id ON route_tracking_history(route_id, reported_at);
CREATE INDEX IF NOT EXISTS idx_route_tracking_vehicle_id ON route_tracking_history(vehicle_id, reported_at);
CREATE INDEX IF NOT EXISTS idx_route_tracking_reported_at ON route_tracking_history(reported_at);
CREATE INDEX IF NOT EXISTS idx_route_tracking_location ON route_tracking_history(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_route_tracking_event_type ON route_tracking_history(event_type, reported_at);

-- PASO 5: ALERTAS DE RUTA (Notificaciones para rutas específicas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    traffic_alert_id UUID REFERENCES traffic_alerts(id) ON DELETE CASCADE,
    
    -- Tipo de alerta de ruta
    alert_type TEXT NOT NULL 
        CHECK (alert_type IN ('traffic_delay', 'route_deviation', 'stop_delay', 'vehicle_breakdown', 'weather', 'custom')),
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Ubicación relacionada (opcional)
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    
    -- Impacto estimado
    estimated_delay_minutes INTEGER DEFAULT 0,
    affects_completion_time BOOLEAN DEFAULT FALSE,
    
    -- Estado de la alerta
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    
    -- Acciones recomendadas
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    auto_reroute_suggested BOOLEAN DEFAULT FALSE,
    
    -- Auditoría y seguimiento
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Índices para route_alerts
CREATE INDEX IF NOT EXISTS idx_route_alerts_route_id ON route_alerts(route_id);
CREATE INDEX IF NOT EXISTS idx_route_alerts_traffic_alert ON route_alerts(traffic_alert_id);
CREATE INDEX IF NOT EXISTS idx_route_alerts_status ON route_alerts(status);
CREATE INDEX IF NOT EXISTS idx_route_alerts_severity ON route_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_route_alerts_created_at ON route_alerts(created_at);

-- PASO 6: CONFIGURACIONES DE OPTIMIZACIÓN DE FLOTA
-- ============================================================================

CREATE TABLE IF NOT EXISTS fleet_optimization_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del trabajo de optimización
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'route_optimization' 
        CHECK (job_type IN ('route_optimization', 'vehicle_assignment', 'load_balancing', 'cost_optimization')),
    
    -- Configuración del trabajo
    optimization_criteria JSONB DEFAULT '{}'::jsonb, -- ej: {"minimize": "distance", "weights": {...}}
    constraints JSONB DEFAULT '{}'::jsonb, -- restricciones de tiempo, capacidad, etc.
    
    -- Datos de entrada
    input_vehicles JSONB DEFAULT '[]'::jsonb,
    input_destinations JSONB DEFAULT '[]'::jsonb,
    input_parameters JSONB DEFAULT '{}'::jsonb,
    
    -- Resultados
    output_routes JSONB DEFAULT '[]'::jsonb,
    optimization_metrics JSONB DEFAULT '{}'::jsonb,
    
    -- Estado del trabajo
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Tiempos de ejecución
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_seconds INTEGER,
    
    -- Información de error si falla
    error_message TEXT,
    error_details JSONB,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para fleet_optimization_jobs
CREATE INDEX IF NOT EXISTS idx_fleet_optimization_company ON fleet_optimization_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_fleet_optimization_status ON fleet_optimization_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fleet_optimization_created_at ON fleet_optimization_jobs(created_at);

-- PASO 7: FUNCIONES Y TRIGGERS AUXILIARES
-- ============================================================================

-- Función para calcular la distancia entre dos puntos (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 NUMERIC, lon1 NUMERIC, 
    lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371; -- Radio de la Tierra en km
    dLat NUMERIC;
    dLon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar el progreso de una ruta basado en el tracking
CREATE OR REPLACE FUNCTION update_route_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la posición actual y progreso de la ruta
    UPDATE routes SET 
        current_latitude = NEW.latitude,
        current_longitude = NEW.longitude,
        progress_percentage = NEW.progress_percentage,
        remaining_distance_meters = NEW.distance_remaining_meters,
        updated_at = NOW()
    WHERE id = NEW.route_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el progreso de rutas
CREATE TRIGGER update_route_progress_trigger
    AFTER INSERT ON route_tracking_history
    FOR EACH ROW
    EXECUTE FUNCTION update_route_progress();

-- Función para crear alertas automáticas cuando hay desviaciones
CREATE OR REPLACE FUNCTION check_route_deviation()
RETURNS TRIGGER AS $$
BEGIN
    -- Si hay una desviación significativa (>100m), crear una alerta
    IF NEW.deviation_meters > 100 THEN
        INSERT INTO route_alerts (
            route_id, 
            alert_type, 
            title, 
            message, 
            severity,
            latitude,
            longitude,
            estimated_delay_minutes
        ) VALUES (
            NEW.route_id,
            'route_deviation',
            'Desviación de Ruta Detectada',
            'El vehículo se ha desviado ' || NEW.deviation_meters || ' metros de la ruta planificada',
            CASE 
                WHEN NEW.deviation_meters > 500 THEN 'high'
                WHEN NEW.deviation_meters > 200 THEN 'medium'
                ELSE 'low'
            END,
            NEW.latitude,
            NEW.longitude,
            (NEW.deviation_meters / 100)::INTEGER -- Estimado simple
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear alertas de desviación automáticamente
CREATE TRIGGER check_route_deviation_trigger
    AFTER INSERT ON route_tracking_history
    FOR EACH ROW
    WHEN (NEW.deviation_meters IS NOT NULL AND NEW.deviation_meters > 100)
    EXECUTE FUNCTION check_route_deviation();

-- PASO 8: VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- ============================================================================

-- Vista para rutas activas con información completa
CREATE OR REPLACE VIEW active_routes_summary AS
SELECT 
    r.id,
    r.company_id,
    r.vehicle_id,
    v.plate as vehicle_plate,
    v.brand || ' ' || v.model as vehicle_info,
    r.route_name,
    r.route_type,
    r.status,
    r.progress_percentage,
    r.total_distance_meters,
    r.remaining_distance_meters,
    r.estimated_arrival_time,
    r.destination_name,
    p.razon_social as destination_client,
    COUNT(rs.id) as total_stops,
    COUNT(rs.id) FILTER (WHERE rs.status = 'completed') as completed_stops,
    r.created_at,
    r.updated_at
FROM routes r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN parties p ON r.destination_party_id = p.id
LEFT JOIN route_stops rs ON r.id = rs.route_id
WHERE r.status IN ('planned', 'active')
GROUP BY r.id, v.plate, v.brand, v.model, p.razon_social;

-- Vista para alertas de tráfico activas
CREATE OR REPLACE VIEW active_traffic_alerts AS
SELECT 
    ta.*,
    COUNT(ra.id) as affected_routes
FROM traffic_alerts ta
LEFT JOIN route_alerts ra ON ta.id = ra.traffic_alert_id
WHERE ta.is_active = true
    AND ta.valid_from <= NOW()
    AND (ta.valid_until IS NULL OR ta.valid_until >= NOW())
GROUP BY ta.id;

-- PASO 9: DATOS INICIALES DE EJEMPLO
-- ============================================================================

-- Insertar algunos tipos de alerta de ejemplo
INSERT INTO traffic_alerts (
    alert_type, severity, title, description, 
    latitude, longitude, affected_radius_meters,
    valid_from, valid_until, source
) VALUES 
(
    'construction', 'medium', 
    'Obras en Av. Arequipa',
    'Obras de mejoramiento vial en Av. Arequipa. Tráfico lento esperado.',
    -12.0464, -77.0428, 500,
    NOW(), NOW() + INTERVAL '7 days',
    'SYSTEM'
),
(
    'congestion', 'high',
    'Congestión en Av. Javier Prado',
    'Tráfico pesado en hora pico. Se recomienda buscar rutas alternativas.',
    -12.0724, -77.0370, 1000,
    NOW(), NOW() + INTERVAL '3 hours',
    'SYSTEM'
),
(
    'accident', 'critical',
    'Accidente en Panamericana Norte',
    'Accidente de tránsito bloquea 2 carriles. Desvío obligatorio.',
    -11.9980, -77.0500, 800,
    NOW(), NOW() + INTERVAL '2 hours',
    'EXTERNAL_API'
) ON CONFLICT DO NOTHING;

-- PASO 10: TRACKING DE DISPOSITIVOS Y USUARIOS
-- ============================================================================

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

-- Índices para registered_devices
CREATE INDEX IF NOT EXISTS idx_registered_devices_user_id ON registered_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_registered_devices_device_type ON registered_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_registered_devices_active ON registered_devices(is_active, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_registered_devices_tracking ON registered_devices(tracking_enabled, is_active);

-- Trigger para updated_at
CREATE TRIGGER update_registered_devices_updated_at 
    BEFORE UPDATE ON registered_devices 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

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

-- PASO 15: DATOS DE EJEMPLO PARA TESTING
-- ============================================================================

-- Insertar algunos dispositivos de ejemplo (solo si no existen)
INSERT INTO registered_devices (
    device_id, device_name, device_type, user_agent, platform, 
    tracking_enabled, location_permission_granted
) VALUES 
(
    'device_test_001', 'iPhone de Juan', 'MOBILE', 
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 'iPhone',
    true, true
),
(
    'device_test_002', 'Android de María', 'MOBILE',
    'Mozilla/5.0 (Linux; Android 11)', 'Android',
    true, true
),
(
    'device_test_003', 'Tablet de Oficina', 'TABLET',
    'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', 'iPad',
    false, false
) ON CONFLICT (device_id) DO NOTHING;

-- PASO 16: COMENTARIOS Y DOCUMENTACIÓN ADICIONAL
-- ============================================================================

COMMENT ON TABLE routes IS 'Tabla principal para gestión de rutas de vehículos';
COMMENT ON TABLE route_stops IS 'Paradas múltiples para rutas complejas';
COMMENT ON TABLE traffic_alerts IS 'Alertas de tráfico que pueden afectar rutas';
COMMENT ON TABLE route_tracking_history IS 'Historial completo de seguimiento de rutas en tiempo real';
COMMENT ON TABLE route_alerts IS 'Alertas específicas para rutas individuales';
COMMENT ON TABLE fleet_optimization_jobs IS 'Trabajos de optimización de flotas y rutas';
COMMENT ON TABLE device_locations IS 'Historial completo de ubicaciones de dispositivos de usuarios';
COMMENT ON TABLE registered_devices IS 'Registro de dispositivos que usan el sistema de tracking';
COMMENT ON TABLE tracking_sessions IS 'Sesiones de tracking de ubicaciones para usuarios/dispositivos';

COMMENT ON FUNCTION calculate_distance_km IS 'Calcula la distancia en kilómetros entre dos puntos usando la fórmula de Haversine';
COMMENT ON FUNCTION update_device_stats IS 'Actualiza automáticamente las estadísticas de dispositivos cuando se registra una nueva ubicación';
COMMENT ON FUNCTION calculate_session_stats IS 'Calcula estadísticas de sesiones de tracking en tiempo real';

COMMENT ON VIEW active_routes_summary IS 'Vista resumida de rutas activas con información del vehículo y progreso';
COMMENT ON VIEW active_traffic_alerts IS 'Vista de alertas de tráfico activas con conteo de rutas afectadas';
COMMENT ON VIEW recent_device_locations IS 'Vista de las ubicaciones más recientes de cada dispositivo registrado';
COMMENT ON VIEW active_tracking_sessions IS 'Vista de sesiones de tracking activas con información del dispositivo y usuario';