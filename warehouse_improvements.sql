-- ============================================================================
-- MEJORAS PARA UBICACIONES DE ALMACÉN CON ESTANTES Y PASILLOS
-- ============================================================================
-- Este script mejora la estructura de ubicaciones agregando:
-- 1. Estantes y niveles
-- 2. Pasillos y secciones
-- 3. Códigos de ubicación alfanuméricos
-- 4. Datos de ejemplo para probar las vistas 2D y 3D
-- ============================================================================

-- PASO 1: AGREGAR NUEVAS TABLAS PARA MEJOR ORGANIZACIÓN
-- ============================================================================


-- Tabla de pasillos dentro de las zonas
CREATE TABLE IF NOT EXISTS warehouse_aisles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_zone_id UUID NOT NULL REFERENCES warehouse_zones(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL, -- A1, A2, B1, B2, etc.
    name TEXT,
    
    -- Posición del pasillo dentro de la zona
    start_x NUMERIC(18,6) DEFAULT 0,
    start_y NUMERIC(18,6) DEFAULT 0,
    end_x NUMERIC(18,6) DEFAULT 0,
    end_y NUMERIC(18,6) DEFAULT 0,
    width NUMERIC(18,6) DEFAULT 2, -- Ancho del pasillo en metros
    
    -- Metadatos
    is_main_aisle BOOLEAN DEFAULT false, -- Pasillo principal
    direction VARCHAR(20) DEFAULT 'HORIZONTAL' CHECK (direction IN ('HORIZONTAL', 'VERTICAL')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(warehouse_zone_id, code)
);

-- Tabla de estantes dentro de los pasillos
CREATE TABLE IF NOT EXISTS warehouse_shelves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_aisle_id UUID NOT NULL REFERENCES warehouse_aisles(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- A1-01, A1-02, B2-15, etc.
    name TEXT,
    
    -- Posición del estante
    position_x NUMERIC(18,6) DEFAULT 0,
    position_y NUMERIC(18,6) DEFAULT 0,
    position_z NUMERIC(18,6) DEFAULT 0, -- Altura base del estante
    
    -- Dimensiones físicas del estante
    width NUMERIC(18,6) DEFAULT 1.2,
    depth NUMERIC(18,6) DEFAULT 0.6,
    height NUMERIC(18,6) DEFAULT 2.5,
    
    -- Configuración de niveles
    levels INTEGER DEFAULT 4, -- Número de niveles del estante
    level_height NUMERIC(18,6) DEFAULT 0.5, -- Altura de cada nivel
    
    -- Capacidad
    max_weight_kg NUMERIC(18,6),
    load_capacity_per_level NUMERIC(18,6),
    
    -- Estado y tipo
    shelf_type VARCHAR(50) DEFAULT 'STANDARD', -- STANDARD, HEAVY_DUTY, CANTILEVER, FLOW_RACK
    material VARCHAR(50) DEFAULT 'STEEL', -- STEEL, WOOD, PLASTIC
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(warehouse_aisle_id, code)
);

-- Tabla de posiciones específicas en los estantes (niveles)
CREATE TABLE IF NOT EXISTS warehouse_shelf_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_shelf_id UUID NOT NULL REFERENCES warehouse_shelves(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL, -- 1, 2, 3, 4 (nivel del estante)
    position_number INTEGER NOT NULL, -- 1, 2, 3 (posición en el nivel)
    
    -- Código de ubicación completo: se generará con trigger
    location_code VARCHAR(50),
    
    -- Dimensiones de la posición
    width NUMERIC(18,6) DEFAULT 0.4,
    depth NUMERIC(18,6) DEFAULT 0.6,
    height NUMERIC(18,6) DEFAULT 0.5,
    
    -- Coordenadas calculadas automáticamente
    calculated_x NUMERIC(18,6),
    calculated_y NUMERIC(18,6),
    calculated_z NUMERIC(18,6),
    
    -- Capacidad y restricciones
    max_weight_kg NUMERIC(18,6),
    max_volume_m3 NUMERIC(18,6),
    is_reserved BOOLEAN DEFAULT false,
    reserved_for_product_id UUID REFERENCES products(id),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    condition VARCHAR(20) DEFAULT 'GOOD' CHECK (condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'OUT_OF_SERVICE')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(warehouse_shelf_id, level_number, position_number)
);

-- PASO 2: ACTUALIZAR TABLA PRODUCT_LOCATION PARA REFERENCIAR LAS NUEVAS ESTRUCTURAS
-- ============================================================================

-- Agregar referencia a posición específica del estante
ALTER TABLE product_location 
ADD COLUMN IF NOT EXISTS warehouse_shelf_position_id UUID REFERENCES warehouse_shelf_positions(id) ON DELETE SET NULL;

-- Agregar índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_product_location_shelf_position 
ON product_location(warehouse_shelf_position_id);

-- PASO 3: FUNCIÓN PARA CALCULAR COORDENADAS AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_shelf_position_coordinates()
RETURNS TRIGGER AS $$
DECLARE
    shelf_record warehouse_shelves%ROWTYPE;
    aisle_record warehouse_aisles%ROWTYPE;
    level_offset NUMERIC;
    position_offset NUMERIC;
BEGIN
    -- Obtener datos del estante
    SELECT * INTO shelf_record 
    FROM warehouse_shelves 
    WHERE id = NEW.warehouse_shelf_id;
    
    -- Obtener datos del pasillo
    SELECT * INTO aisle_record 
    FROM warehouse_aisles 
    WHERE id = shelf_record.warehouse_aisle_id;
    
    -- Generar código de ubicación
    NEW.location_code = aisle_record.code || '-' || shelf_record.code || '-' || NEW.level_number || '-' || NEW.position_number;
    
    -- Calcular offset por nivel (altura)
    level_offset = shelf_record.position_z + (NEW.level_number - 1) * shelf_record.level_height;
    
    -- Calcular offset por posición en el nivel
    IF aisle_record.direction = 'HORIZONTAL' THEN
        position_offset = shelf_record.position_x + (NEW.position_number - 1) * NEW.width;
        NEW.calculated_x = position_offset;
        NEW.calculated_y = shelf_record.position_y;
    ELSE
        position_offset = shelf_record.position_y + (NEW.position_number - 1) * NEW.depth;
        NEW.calculated_x = shelf_record.position_x;
        NEW.calculated_y = position_offset;
    END IF;
    
    NEW.calculated_z = level_offset;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular coordenadas automáticamente
CREATE TRIGGER trg_calculate_shelf_coordinates
    BEFORE INSERT OR UPDATE ON warehouse_shelf_positions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_shelf_position_coordinates();

-- PASO 4: VISTA CONSOLIDADA PARA UBICACIONES COMPLETAS
-- ============================================================================

CREATE OR REPLACE VIEW v_product_locations_detailed AS
SELECT 
    pl.id,
    pl.product_id,
    p.name as product_name,
    p.sku as product_sku,
    
    -- Información del almacén
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.code as warehouse_code,
    
    -- Información de la zona
    wz.id as zone_id,
    wz.name as zone_name,
    wz.code as zone_code,
    
    -- Información del pasillo (si existe)
    wa.id as aisle_id,
    wa.code as aisle_code,
    wa.name as aisle_name,
    wa.direction as aisle_direction,
    
    -- Información del estante (si existe)
    ws.id as shelf_id,
    ws.code as shelf_code,
    ws.name as shelf_name,
    ws.shelf_type,
    
    -- Información de la posición específica (si existe)
    wsp.id as shelf_position_id,
    wsp.location_code as full_location_code,
    wsp.level_number,
    wsp.position_number,
    wsp.condition as position_condition,
    
    -- Coordenadas (priorizando las más específicas)
    COALESCE(wsp.calculated_x, pl.position_x, ws.position_x, 0) as final_x,
    COALESCE(wsp.calculated_y, pl.position_y, ws.position_y, 0) as final_y,
    COALESCE(wsp.calculated_z, pl.position_z, ws.position_z, 0) as final_z,
    
    -- Stock y capacidad
    pl.stock_actual,
    pl.capacity_max,
    pl.es_principal,
    pl.estado,
    
    -- Timestamps
    pl.created_at,
    pl.updated_at
    
FROM product_location pl
JOIN products p ON p.id = pl.product_id
LEFT JOIN warehouse_zones wz ON wz.id = pl.warehouse_zone_id
LEFT JOIN warehouses w ON w.id = wz.warehouse_id
LEFT JOIN warehouse_shelf_positions wsp ON wsp.id = pl.warehouse_shelf_position_id
LEFT JOIN warehouse_shelves ws ON ws.id = wsp.warehouse_shelf_id
LEFT JOIN warehouse_aisles wa ON wa.id = ws.warehouse_aisle_id
WHERE pl.estado = true
ORDER BY w.name, wz.code, wa.code, ws.code, wsp.level_number, wsp.position_number;

-- PASO 5: DATOS DE EJEMPLO PARA PROBAR LAS VISTAS
-- ============================================================================

-- Nota: Ejecutar solo si quieres datos de ejemplo
-- Reemplaza 'YOUR_COMPANY_ID' con tu ID de empresa real
-- Reemplaza 'YOUR_WAREHOUSE_ID' con tu ID de almacén real

-- Ejemplo para crear estructura de pasillos y estantes:

/*
-- Insertar pasillos de ejemplo
INSERT INTO warehouse_aisles (company_id, warehouse_zone_id, code, name, start_x, start_y, end_x, end_y, direction, width)
SELECT 
    'YOUR_COMPANY_ID'::UUID,
    wz.id,
    'A' || generate_series(1, 5),
    'Pasillo A' || generate_series(1, 5),
    (generate_series(1, 5) - 1) * 4,
    0,
    (generate_series(1, 5) - 1) * 4,
    20,
    'VERTICAL',
    2
FROM warehouse_zones wz 
WHERE wz.company_id = 'YOUR_COMPANY_ID'::UUID 
LIMIT 1;

-- Insertar estantes de ejemplo
INSERT INTO warehouse_shelves (company_id, warehouse_aisle_id, code, position_x, position_y, width, depth, height, levels)
SELECT 
    'YOUR_COMPANY_ID'::UUID,
    wa.id,
    LPAD(generate_series(1, 10)::TEXT, 2, '0'),
    wa.start_x + 1,
    generate_series(0, 9) * 2,
    1.2,
    0.6,
    2.5,
    4
FROM warehouse_aisles wa
WHERE wa.company_id = 'YOUR_COMPANY_ID'::UUID;

-- Insertar posiciones de estantes de ejemplo
INSERT INTO warehouse_shelf_positions (company_id, warehouse_shelf_id, level_number, position_number, width, depth, height, max_weight_kg)
SELECT 
    'YOUR_COMPANY_ID'::UUID,
    ws.id,
    level_num,
    pos_num,
    0.4,
    0.6,
    0.5,
    50
FROM warehouse_shelves ws
CROSS JOIN generate_series(1, 4) as level_num
CROSS JOIN generate_series(1, 3) as pos_num
WHERE ws.company_id = 'YOUR_COMPANY_ID'::UUID;
*/

-- PASO 6: ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_warehouse_aisles_zone ON warehouse_aisles(warehouse_zone_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shelves_aisle ON warehouse_shelves(warehouse_aisle_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shelf_positions_shelf ON warehouse_shelf_positions(warehouse_shelf_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shelf_positions_code ON warehouse_shelf_positions(location_code);

-- PASO 7: COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE warehouse_aisles IS 'Pasillos dentro de las zonas de almacén para mejor organización';
COMMENT ON TABLE warehouse_shelves IS 'Estantes ubicados en los pasillos con múltiples niveles';
COMMENT ON TABLE warehouse_shelf_positions IS 'Posiciones específicas en cada nivel de los estantes';
COMMENT ON COLUMN warehouse_shelf_positions.location_code IS 'Código completo de ubicación: Pasillo-Estante-Nivel-Posición (ej: A1-01-3-2)';
COMMENT ON VIEW v_product_locations_detailed IS 'Vista consolidada con información completa de ubicaciones jerárquicas';

-- ============================================================================
-- FIN DEL SCRIPT DE MEJORAS
-- ============================================================================

-- Para usar estas mejoras:
-- 1. Ejecuta este script en tu base de datos Supabase
-- 2. Actualiza los IDs en la sección de datos de ejemplo
-- 3. Las vistas 2D y 3D automáticamente usarán las coordenadas calculadas
-- 4. El sistema mantendrá compatibilidad con ubicaciones existentes