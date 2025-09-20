-- ============================================================================
-- FUNCIONES AUXILIARES PARA ASIGNACIÓN DE UBICACIONES
-- ============================================================================

-- Función para obtener posiciones disponibles en un almacén
CREATE OR REPLACE FUNCTION get_available_positions(
    p_warehouse_id UUID,
    p_zone_id UUID DEFAULT NULL
)
RETURNS TABLE (
    position_id UUID,
    location_code TEXT,
    zone_id UUID,
    zone_code TEXT,
    zone_name TEXT,
    aisle_id UUID,
    aisle_code TEXT,
    shelf_id UUID,
    shelf_code TEXT,
    level_number INTEGER,
    position_number INTEGER,
    is_occupied BOOLEAN,
    current_product_id UUID,
    current_stock NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH occupied_positions AS (
        SELECT
            pl.warehouse_shelf_position_id,
            pl.product_id,
            pl.stock_actual
        FROM product_location pl
        WHERE pl.estado = true
          AND pl.warehouse_id = p_warehouse_id
    )
    SELECT
        wsp.id AS position_id,
        wsp.location_code,
        wz.id AS zone_id,
        wz.code AS zone_code,
        wz.name AS zone_name,
        wa.id AS aisle_id,
        wa.code AS aisle_code,
        ws.id AS shelf_id,
        ws.code AS shelf_code,
        wsp.level_number,
        wsp.position_number,
        (op.warehouse_shelf_position_id IS NOT NULL) AS is_occupied,
        op.product_id AS current_product_id,
        COALESCE(op.stock_actual, 0) AS current_stock
    FROM warehouse_shelf_positions wsp
    JOIN warehouse_shelves ws ON ws.id = wsp.warehouse_shelf_id
    JOIN warehouse_aisles wa ON wa.id = ws.warehouse_aisle_id
    JOIN warehouse_zones wz ON wz.id = wa.warehouse_zone_id
    LEFT JOIN occupied_positions op ON op.warehouse_shelf_position_id = wsp.id
    WHERE wz.warehouse_id = p_warehouse_id
      AND wsp.is_active = true
      AND (p_zone_id IS NULL OR wz.id = p_zone_id)
    ORDER BY wz.code, wa.code, ws.code, wsp.level_number, wsp.position_number;
END;
$$;

-- Función para obtener productos sin ubicación
CREATE OR REPLACE FUNCTION get_unassigned_products(
    p_company_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    sku TEXT,
    total_stock NUMERIC,
    category_name TEXT,
    brand_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH assigned_products AS (
        SELECT DISTINCT pl.product_id
        FROM product_location pl
        WHERE pl.estado = true
    )
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        COALESCE(p.total_stock, 0) AS total_stock,
        pc.name AS category_name,
        pb.name AS brand_name
    FROM products p
    LEFT JOIN product_categories pc ON pc.id = p.category_id
    LEFT JOIN product_brands pb ON pb.id = p.brand_id
    LEFT JOIN assigned_products ap ON ap.product_id = p.id
    WHERE p.company_id = p_company_id
      AND p.active = true
      AND ap.product_id IS NULL
    ORDER BY p.name;
END;
$$;

-- Función para asignación masiva de productos
CREATE OR REPLACE FUNCTION bulk_assign_products(
    p_company_id UUID,
    p_warehouse_id UUID,
    p_product_ids UUID[],
    p_zone_id UUID DEFAULT NULL,
    p_default_stock NUMERIC DEFAULT 0,
    p_strategy TEXT DEFAULT 'sequential'
)
RETURNS TABLE (
    product_id UUID,
    position_id UUID,
    location_code TEXT,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_position_record RECORD;
    v_available_positions CURSOR FOR
        SELECT * FROM get_available_positions(p_warehouse_id, p_zone_id)
        WHERE is_occupied = false
        ORDER BY zone_code, aisle_code, shelf_code, level_number, position_number;
    v_assignment_count INTEGER := 0;
BEGIN
    -- Abrir cursor de posiciones disponibles
    OPEN v_available_positions;

    -- Iterar sobre cada producto
    FOREACH v_product_id IN ARRAY p_product_ids
    LOOP
        -- Obtener la siguiente posición disponible
        FETCH v_available_positions INTO v_position_record;

        IF FOUND THEN
            BEGIN
                -- Intentar crear la asignación
                INSERT INTO product_location (
                    product_id,
                    warehouse_id,
                    warehouse_zone_id,
                    warehouse_shelf_position_id,
                    stock_actual,
                    capacity_max,
                    location_priority,
                    es_principal,
                    estado
                ) VALUES (
                    v_product_id,
                    p_warehouse_id,
                    v_position_record.zone_id,
                    v_position_record.position_id,
                    p_default_stock,
                    100,
                    1,
                    v_assignment_count = 0, -- Primera asignación es principal
                    true
                );

                v_assignment_count := v_assignment_count + 1;

                -- Retornar éxito
                RETURN QUERY SELECT
                    v_product_id,
                    v_position_record.position_id,
                    v_position_record.location_code,
                    true,
                    NULL::TEXT;

            EXCEPTION WHEN OTHERS THEN
                -- Retornar error
                RETURN QUERY SELECT
                    v_product_id,
                    v_position_record.position_id,
                    v_position_record.location_code,
                    false,
                    SQLERRM;
            END;
        ELSE
            -- No hay más posiciones disponibles
            RETURN QUERY SELECT
                v_product_id,
                NULL::UUID,
                NULL::TEXT,
                false,
                'No hay posiciones disponibles'::TEXT;
        END IF;
    END LOOP;

    CLOSE v_available_positions;
END;
$$;

-- Función para obtener estadísticas de almacén
CREATE OR REPLACE FUNCTION get_warehouse_stats(
    p_warehouse_id UUID
)
RETURNS TABLE (
    total_zones INTEGER,
    total_aisles INTEGER,
    total_shelves INTEGER,
    total_positions INTEGER,
    occupied_positions INTEGER,
    available_positions INTEGER,
    occupancy_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(DISTINCT wz.id) AS zones,
            COUNT(DISTINCT wa.id) AS aisles,
            COUNT(DISTINCT ws.id) AS shelves,
            COUNT(wsp.id) AS positions,
            COUNT(pl.id) AS occupied
        FROM warehouse_zones wz
        LEFT JOIN warehouse_aisles wa ON wa.warehouse_zone_id = wz.id
        LEFT JOIN warehouse_shelves ws ON ws.warehouse_aisle_id = wa.id
        LEFT JOIN warehouse_shelf_positions wsp ON wsp.warehouse_shelf_id = ws.id AND wsp.is_active = true
        LEFT JOIN product_location pl ON pl.warehouse_shelf_position_id = wsp.id AND pl.estado = true
        WHERE wz.warehouse_id = p_warehouse_id
    )
    SELECT
        zones::INTEGER,
        aisles::INTEGER,
        shelves::INTEGER,
        positions::INTEGER,
        occupied::INTEGER,
        (positions - occupied)::INTEGER AS available,
        CASE
            WHEN positions > 0 THEN ROUND((occupied::NUMERIC / positions::NUMERIC) * 100, 2)
            ELSE 0
        END
    FROM stats;
END;
$$;

-- Vista materializada para mejorar performance de consultas de ubicaciones
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_location_summary AS
SELECT
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    wz.id AS zone_id,
    wz.code AS zone_code,
    wz.name AS zone_name,
    COUNT(wsp.id) AS total_positions,
    COUNT(pl.id) AS occupied_positions,
    COUNT(wsp.id) - COUNT(pl.id) AS available_positions,
    CASE
        WHEN COUNT(wsp.id) > 0
        THEN ROUND((COUNT(pl.id)::NUMERIC / COUNT(wsp.id)::NUMERIC) * 100, 2)
        ELSE 0
    END AS occupancy_rate
FROM warehouses w
JOIN warehouse_zones wz ON wz.warehouse_id = w.id
LEFT JOIN warehouse_aisles wa ON wa.warehouse_zone_id = wz.id
LEFT JOIN warehouse_shelves ws ON ws.warehouse_aisle_id = wa.id
LEFT JOIN warehouse_shelf_positions wsp ON wsp.warehouse_shelf_id = ws.id AND wsp.is_active = true
LEFT JOIN product_location pl ON pl.warehouse_shelf_position_id = wsp.id AND pl.estado = true
WHERE w.deleted_at IS NULL
GROUP BY w.id, w.name, wz.id, wz.code, wz.name
ORDER BY w.name, wz.code;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_product_location_warehouse_shelf_position
ON product_location(warehouse_shelf_position_id) WHERE estado = true;

CREATE INDEX IF NOT EXISTS idx_warehouse_shelf_positions_active
ON warehouse_shelf_positions(warehouse_shelf_id, is_active) WHERE is_active = true;

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_location_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_location_summary;
END;
$$;

-- Trigger para refrescar automáticamente cuando cambian las ubicaciones
CREATE OR REPLACE FUNCTION trigger_refresh_location_summary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refrescar en background para no bloquear la transacción
    PERFORM pg_notify('refresh_location_summary', '');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Crear triggers para auto-refresh
DROP TRIGGER IF EXISTS trg_refresh_location_summary_insert ON product_location;
CREATE TRIGGER trg_refresh_location_summary_insert
    AFTER INSERT OR UPDATE OR DELETE ON product_location
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_location_summary();

DROP TRIGGER IF EXISTS trg_refresh_location_summary_positions ON warehouse_shelf_positions;
CREATE TRIGGER trg_refresh_location_summary_positions
    AFTER INSERT OR UPDATE OR DELETE ON warehouse_shelf_positions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_location_summary();

-- Comentarios para documentación
COMMENT ON FUNCTION get_available_positions(UUID, UUID) IS 'Obtiene todas las posiciones disponibles en un almacén, opcionalmente filtradas por zona';
COMMENT ON FUNCTION get_unassigned_products(UUID) IS 'Obtiene todos los productos que no tienen ubicación asignada';
COMMENT ON FUNCTION bulk_assign_products(UUID, UUID, UUID[], UUID, NUMERIC, TEXT) IS 'Asigna múltiples productos a ubicaciones disponibles usando diferentes estrategias';
COMMENT ON FUNCTION get_warehouse_stats(UUID) IS 'Obtiene estadísticas de ocupación de un almacén';
COMMENT ON MATERIALIZED VIEW mv_location_summary IS 'Vista materializada con resumen de ocupación por zona';

-- Inicializar la vista materializada
SELECT refresh_location_summary();