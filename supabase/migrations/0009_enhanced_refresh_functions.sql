-- Función mejorada para actualizar todas las vistas materializadas de ventas
CREATE OR REPLACE FUNCTION refresh_all_sales_materialized_views()
RETURNS void AS $$
BEGIN
    -- Actualizar las vistas base primero (usar CONCURRENTLY solo si los índices únicos están disponibles)
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_dashboard_base;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_dashboard_base;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_time_period;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_by_time_period;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_seller;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_by_seller;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_product;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_by_product;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_customer;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_by_customer;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_branch;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_by_branch;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_monthly_trend;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_monthly_trend;
    END;

    -- Actualizar las vistas de rentabilidad y análisis
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_profit_monthly;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_profit_monthly;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_trend_monthly;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_trend_monthly;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_channel_monthly;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_sales_channel_monthly;
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profitability_metrics_monthly;
    EXCEPTION WHEN others THEN
        REFRESH MATERIALIZED VIEW mv_profitability_metrics_monthly;
    END;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener información sobre las vistas materializadas
CREATE OR REPLACE FUNCTION get_materialized_views_info()
RETURNS TABLE(
    view_name text,
    last_refresh timestamp with time zone,
    refresh_in_progress boolean,
    size_bytes bigint,
    row_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || matviewname as view_name,
        COALESCE(pg_stat_user_tables.last_vacuum, pg_stat_user_tables.last_autovacuum) as last_refresh,
        false as refresh_in_progress, -- Se podría mejorar para detectar refreshes en progreso
        pg_total_relation_size(schemaname||'.'||matviewname)::bigint as size_bytes,
        COALESCE(n_tup_ins + n_tup_upd + n_tup_del, 0)::bigint as row_count
    FROM pg_matviews 
    LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = pg_matviews.matviewname
    WHERE schemaname = 'public' 
    AND matviewname LIKE 'mv_sales_%'
    ORDER BY view_name;
END;
$$ LANGUAGE plpgsql;

-- Función para refrescar una vista específica por nombre
CREATE OR REPLACE FUNCTION refresh_single_sales_view(view_name text)
RETURNS void AS $$
BEGIN
    CASE view_name
        WHEN 'mv_sales_dashboard_base' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_dashboard_base;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_dashboard_base;
            END;
        WHEN 'mv_sales_by_time_period' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_time_period;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_by_time_period;
            END;
        WHEN 'mv_sales_by_seller' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_seller;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_by_seller;
            END;
        WHEN 'mv_sales_by_product' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_product;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_by_product;
            END;
        WHEN 'mv_sales_by_customer' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_customer;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_by_customer;
            END;
        WHEN 'mv_sales_by_branch' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_branch;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_by_branch;
            END;
        WHEN 'mv_sales_monthly_trend' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_monthly_trend;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_monthly_trend;
            END;
        WHEN 'mv_sales_profit_monthly' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_profit_monthly;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_profit_monthly;
            END;
        WHEN 'mv_sales_trend_monthly' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_trend_monthly;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_trend_monthly;
            END;
        WHEN 'mv_sales_channel_monthly' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_channel_monthly;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_sales_channel_monthly;
            END;
        WHEN 'mv_profitability_metrics_monthly' THEN
            BEGIN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profitability_metrics_monthly;
            EXCEPTION WHEN others THEN
                REFRESH MATERIALIZED VIEW mv_profitability_metrics_monthly;
            END;
        ELSE
            RAISE EXCEPTION 'Vista no reconocida: %', view_name;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función para programar actualización automática (se puede usar con pg_cron si está disponible)
CREATE OR REPLACE FUNCTION schedule_sales_views_refresh()
RETURNS text AS $$
BEGIN
    -- Esta función se puede usar con pg_cron para programar actualizaciones automáticas
    -- Por ejemplo: SELECT cron.schedule('refresh-sales-views', '0 1 * * *', 'SELECT refresh_all_sales_materialized_views();');
    
    PERFORM refresh_all_sales_materialized_views();
    
    RETURN 'Vistas materializadas actualizadas exitosamente a las ' || NOW()::text;
END;
$$ LANGUAGE plpgsql;

-- Crear índices únicos en las vistas materializadas para permitir REFRESH CONCURRENTLY
-- Estos índices son necesarios para el refresh concurrente
-- Nota: No se puede usar CONCURRENTLY en migraciones, se ejecutan normalmente

-- mv_sales_dashboard_base
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_dashboard_base_unique 
ON mv_sales_dashboard_base (sales_doc_id, product_id);

-- mv_sales_by_time_period
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_by_time_period_unique 
ON mv_sales_by_time_period (company_id, sale_day, sale_month, sale_quarter, sale_year);

-- mv_sales_by_seller
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_by_seller_unique 
ON mv_sales_by_seller (company_id, seller_user_id, sale_month, sale_quarter, sale_year);

-- mv_sales_by_product
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_by_product_unique 
ON mv_sales_by_product (company_id, product_id, sale_month, sale_quarter, sale_year);

-- mv_sales_by_customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_by_customer_unique 
ON mv_sales_by_customer (company_id, customer_id, sale_month, sale_quarter, sale_year);

-- mv_sales_by_branch
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_by_branch_unique 
ON mv_sales_by_branch (company_id, branch_id, sale_month, sale_quarter, sale_year);

-- mv_sales_monthly_trend
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_monthly_trend_unique 
ON mv_sales_monthly_trend (company_id, sale_month, sale_year);

-- mv_sales_profit_monthly
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_profit_monthly_unique 
ON mv_sales_profit_monthly (company_id, sale_month, sale_year);

-- mv_sales_trend_monthly
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_trend_monthly_unique 
ON mv_sales_trend_monthly (company_id, sale_month, sale_year);

-- mv_sales_channel_monthly
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sales_channel_monthly_unique 
ON mv_sales_channel_monthly (company_id, sale_month, doc_type);

-- mv_profitability_metrics_monthly
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_profitability_metrics_monthly_unique 
ON mv_profitability_metrics_monthly (company_id, sale_month, sale_year);

-- Comentarios para documentación
COMMENT ON FUNCTION refresh_all_sales_materialized_views() IS 
'Actualiza todas las vistas materializadas relacionadas con ventas de forma concurrente';

COMMENT ON FUNCTION get_materialized_views_info() IS 
'Obtiene información sobre el estado y tamaño de las vistas materializadas de ventas';

COMMENT ON FUNCTION refresh_single_sales_view(text) IS 
'Actualiza una vista materializada específica por nombre';

COMMENT ON FUNCTION schedule_sales_views_refresh() IS 
'Función auxiliar para programar actualizaciones automáticas con pg_cron';