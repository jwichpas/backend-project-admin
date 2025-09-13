-- ============================================================================
-- ÍNDICES ÚNICOS PARA VISTAS MATERIALIZADAS (REFRESH CONCURRENTLY)
-- ============================================================================

-- Para poder usar REFRESH MATERIALIZED VIEW CONCURRENTLY, necesitamos índices únicos
-- en todas las vistas materializadas

-- 1. Vista base: mv_sales_dashboard_base
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_base_unique 
ON mv_sales_dashboard_base (sales_doc_id, product_id);

-- 2. Vista por períodos de tiempo: mv_sales_by_time_period  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_time_unique
ON mv_sales_by_time_period (company_id, sale_day, sale_week, sale_month, sale_quarter, sale_year);

-- 3. Vista por vendedor: mv_sales_by_seller
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_seller_unique
ON mv_sales_by_seller (company_id, seller_user_id, sale_month, sale_quarter, sale_year);

-- 4. Vista por producto: mv_sales_by_product
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_product_unique
ON mv_sales_by_product (company_id, product_id, sale_month, sale_quarter, sale_year);

-- 5. Vista por cliente: mv_sales_by_customer  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_customer_unique
ON mv_sales_by_customer (company_id, customer_id, sale_month, sale_quarter, sale_year);

-- 6. Vista por sucursal: mv_sales_by_branch
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_branch_unique  
ON mv_sales_by_branch (company_id, branch_id, sale_month, sale_quarter, sale_year);

-- 7. Vista de tendencia mensual: mv_sales_monthly_trend
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_trend_unique
ON mv_sales_monthly_trend (company_id, sale_month, sale_year);

-- ============================================================================
-- FUNCIÓN MEJORADA PARA REFRESH CONCURRENTE
-- ============================================================================

-- Reemplazar la función existente para usar REFRESH CONCURRENTLY
CREATE OR REPLACE FUNCTION refresh_sales_materialized_views()
RETURNS void AS $$
DECLARE
    view_record RECORD;
    error_msg TEXT;
BEGIN
    -- Lista de vistas en el orden correcto de dependencias
    FOR view_record IN 
        SELECT unnest(ARRAY[
            'mv_sales_dashboard_base',
            'mv_sales_by_time_period', 
            'mv_sales_by_seller',
            'mv_sales_by_product',
            'mv_sales_by_customer', 
            'mv_sales_by_branch',
            'mv_sales_monthly_trend'
        ]) AS view_name
    LOOP
        BEGIN
            -- Intentar refresh concurrente primero
            EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_record.view_name);
            RAISE NOTICE 'Successfully refreshed % concurrently', view_record.view_name;
            
        EXCEPTION 
            WHEN OTHERS THEN
                -- Si falla el concurrente, usar refresh normal
                GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
                RAISE WARNING 'Concurrent refresh failed for %, using normal refresh. Error: %', 
                    view_record.view_name, error_msg;
                
                EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_record.view_name);
                RAISE NOTICE 'Successfully refreshed % (normal)', view_record.view_name;
        END;
    END LOOP;
    
    RAISE NOTICE 'All sales dashboard views have been refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN ADICIONAL PARA REFRESH INDIVIDUAL
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_single_sales_view(view_name TEXT)
RETURNS void AS $$
DECLARE
    error_msg TEXT;
    valid_views TEXT[] := ARRAY[
        'mv_sales_dashboard_base',
        'mv_sales_by_time_period', 
        'mv_sales_by_seller',
        'mv_sales_by_product',
        'mv_sales_by_customer', 
        'mv_sales_by_branch',
        'mv_sales_monthly_trend'
    ];
BEGIN
    -- Validar que la vista sea válida
    IF view_name <> ALL(valid_views) THEN
        RAISE EXCEPTION 'Invalid view name: %. Valid views are: %', view_name, valid_views;
    END IF;
    
    BEGIN
        -- Intentar refresh concurrente primero
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
        RAISE NOTICE 'Successfully refreshed % concurrently', view_name;
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- Si falla el concurrente, usar refresh normal
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE WARNING 'Concurrent refresh failed for %, using normal refresh. Error: %', 
                view_name, error_msg;
            
            EXECUTE format('REFRESH MATERIALIZED VIEW %I', view_name);
            RAISE NOTICE 'Successfully refreshed % (normal)', view_name;
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN PARA VERIFICAR ESTADO DE VISTAS MATERIALIZADAS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_materialized_views_info()
RETURNS TABLE (
    schema_name TEXT,
    view_name TEXT,
    is_populated BOOLEAN,
    size_pretty TEXT,
    last_refresh TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        matviewname::TEXT,
        ispopulated,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname))::TEXT,
        (SELECT GREATEST(
            COALESCE((SELECT last_vacuum FROM pg_stat_user_tables WHERE schemaname = mv.schemaname AND tablename = mv.matviewname), '1970-01-01'::timestamp),
            COALESCE((SELECT last_analyze FROM pg_stat_user_tables WHERE schemaname = mv.schemaname AND tablename = mv.matviewname), '1970-01-01'::timestamp)
        ))::timestamp with time zone
    FROM pg_matviews mv
    WHERE matviewname LIKE 'mv_sales_%'
    ORDER BY matviewname;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISOS Y SEGURIDAD
-- ============================================================================

-- Asegurar que las funciones puedan ser ejecutadas por usuarios autenticados
GRANT EXECUTE ON FUNCTION refresh_sales_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_single_sales_view(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_materialized_views_info() TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION refresh_sales_materialized_views() IS 'Refresca todas las vistas materializadas del dashboard de ventas, intentando usar REFRESH CONCURRENTLY cuando sea posible';
COMMENT ON FUNCTION refresh_single_sales_view(TEXT) IS 'Refresca una vista materializada específica del dashboard de ventas';
COMMENT ON FUNCTION get_materialized_views_info() IS 'Obtiene información sobre el estado de las vistas materializadas de ventas';