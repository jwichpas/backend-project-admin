-- ============================================================================
-- VISTAS MATERIALIZADAS AVANZADAS PARA DASHBOARD DE VENTAS
-- ============================================================================
-- Autor: Sistema ERP
-- Fecha: Actual
-- Descripción: Vistas especializadas para análisis de rentabilidad, tendencias y canales

-- ============================================================================
-- 1. VISTA DE GANANCIAS MENSUALES (mv_sales_profit_monthly)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_sales_profit_monthly AS
SELECT
    sd.company_id,
    c.legal_name AS company_name,
    DATE_TRUNC('month', sd.issue_date) AS sale_month,
    EXTRACT(YEAR FROM sd.issue_date) AS sale_year,
    EXTRACT(MONTH FROM sd.issue_date) AS month_number,
    
    -- Agregaciones de ventas
    COUNT(DISTINCT sd.id) AS total_documents,
    COUNT(DISTINCT sd.customer_id) AS unique_customers,
    COUNT(DISTINCT sdi.product_id) AS unique_products,
    SUM(sdi.quantity) AS total_items_sold,
    
    -- Ventas por moneda
    SUM(CASE WHEN sd.currency_code = 'PEN' THEN sd.total ELSE 0 END) AS sales_pen,
    SUM(CASE WHEN sd.currency_code = 'USD' THEN sd.total ELSE 0 END) AS sales_usd,
    SUM(CASE WHEN sd.currency_code = 'CLP' THEN sd.total ELSE 0 END) AS sales_clp,
    
    -- Ventas en moneda local (convertidas)
    SUM(sd.total_local) AS sales_local,
    
    -- Costos estimados (usando stock_ledger para calcular COGS)
    COALESCE(
        SUM(sl.total_cost_out), 
        SUM(sd.total_local) * 0.7  -- Fallback: 70% del total como costo estimado
    ) AS total_cost_local,
    
    -- Ganancias brutas
    SUM(sd.total_local) - COALESCE(
        SUM(sl.total_cost_out), 
        SUM(sd.total_local) * 0.7
    ) AS gross_profit_local,
    
    -- Margen de ganancia
    CASE 
        WHEN SUM(sd.total_local) > 0 THEN
            ((SUM(sd.total_local) - COALESCE(SUM(sl.total_cost_out), SUM(sd.total_local) * 0.7)) / SUM(sd.total_local)) * 100
        ELSE 0
    END AS profit_margin_percent,
    
    -- Ticket promedio
    CASE 
        WHEN COUNT(DISTINCT sd.id) > 0 THEN SUM(sd.total_local) / COUNT(DISTINCT sd.id)
        ELSE 0
    END AS avg_ticket_value,
    
    -- IGV total
    SUM(sd.total_igv_local) AS total_tax_local

FROM sales_docs sd
JOIN companies c ON sd.company_id = c.id
JOIN sales_doc_items sdi ON sd.id = sdi.sales_doc_id
LEFT JOIN stock_ledger sl ON sl.product_id = sdi.product_id 
    AND sl.source_id = sd.id 
    AND sl.source = 'sales_doc'
    AND sl.qty_out > 0
WHERE sd.deleted_at IS NULL
GROUP BY 
    sd.company_id, c.legal_name, 
    DATE_TRUNC('month', sd.issue_date),
    EXTRACT(YEAR FROM sd.issue_date),
    EXTRACT(MONTH FROM sd.issue_date)
ORDER BY sale_month DESC;

-- ============================================================================
-- 2. VISTA DE TENDENCIAS MENSUALES (mv_sales_trend_monthly)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_sales_trend_monthly AS
WITH monthly_sales AS (
    SELECT
        company_id,
        DATE_TRUNC('month', issue_date) AS sale_month,
        SUM(total_local) AS monthly_sales,
        COUNT(DISTINCT id) AS monthly_transactions,
        COUNT(DISTINCT customer_id) AS monthly_customers,
        AVG(total_local) AS avg_transaction_value
    FROM sales_docs
    WHERE deleted_at IS NULL
    GROUP BY company_id, DATE_TRUNC('month', issue_date)
)
SELECT
    ms.company_id,
    c.legal_name AS company_name,
    ms.sale_month,
    EXTRACT(YEAR FROM ms.sale_month) AS sale_year,
    EXTRACT(MONTH FROM ms.sale_month) AS month_number,
    
    -- Valores actuales
    ms.monthly_sales,
    ms.monthly_transactions,
    ms.monthly_customers,
    ms.avg_transaction_value,
    
    -- Comparación con mes anterior
    LAG(ms.monthly_sales, 1) OVER (
        PARTITION BY ms.company_id 
        ORDER BY ms.sale_month
    ) AS previous_month_sales,
    
    LAG(ms.monthly_transactions, 1) OVER (
        PARTITION BY ms.company_id 
        ORDER BY ms.sale_month
    ) AS previous_month_transactions,
    
    -- Crecimiento mes a mes
    CASE 
        WHEN LAG(ms.monthly_sales, 1) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month) > 0 THEN
            ((ms.monthly_sales - LAG(ms.monthly_sales, 1) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month)) / 
             LAG(ms.monthly_sales, 1) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month)) * 100
        ELSE NULL
    END AS mom_growth_percent,
    
    -- Comparación con mismo mes año anterior
    LAG(ms.monthly_sales, 12) OVER (
        PARTITION BY ms.company_id 
        ORDER BY ms.sale_month
    ) AS same_month_last_year,
    
    -- Crecimiento interanual
    CASE 
        WHEN LAG(ms.monthly_sales, 12) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month) > 0 THEN
            ((ms.monthly_sales - LAG(ms.monthly_sales, 12) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month)) / 
             LAG(ms.monthly_sales, 12) OVER (PARTITION BY ms.company_id ORDER BY ms.sale_month)) * 100
        ELSE NULL
    END AS yoy_growth_percent,
    
    -- Promedio móvil de 3 meses
    AVG(ms.monthly_sales) OVER (
        PARTITION BY ms.company_id 
        ORDER BY ms.sale_month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS three_month_avg,
    
    -- Tendencia (simple: diferencia con promedio móvil)
    ms.monthly_sales - AVG(ms.monthly_sales) OVER (
        PARTITION BY ms.company_id 
        ORDER BY ms.sale_month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS trend_deviation

FROM monthly_sales ms
JOIN companies c ON ms.company_id = c.id
ORDER BY ms.company_id, ms.sale_month DESC;

-- ============================================================================
-- 3. VISTA DE CANALES DE VENTA MENSUALES (mv_sales_channel_monthly)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_sales_channel_monthly AS
SELECT
    sd.company_id,
    c.legal_name AS company_name,
    DATE_TRUNC('month', sd.issue_date) AS sale_month,
    EXTRACT(YEAR FROM sd.issue_date) AS sale_year,
    EXTRACT(MONTH FROM sd.issue_date) AS month_number,
    
    -- Canal de venta (basado en el usuario que creó o branch)
    CASE 
        WHEN br.name IS NOT NULL THEN CONCAT('Sucursal: ', br.name)
        WHEN prof.first_name IS NOT NULL THEN 'Vendedor Directo'
        ELSE 'Canal Online'
    END AS sales_channel,
    
    -- Información de la sucursal
    sd.branch_id,
    br.name AS branch_name,
    br.code AS branch_code,
    
    -- Información del vendedor
    sd.created_by AS seller_user_id,
    COALESCE(prof.first_name || ' ' || prof.last_name, u.email) AS seller_name,
    u.email AS seller_email,
    
    -- Métricas del canal
    COUNT(DISTINCT sd.id) AS total_documents,
    COUNT(DISTINCT sd.customer_id) AS unique_customers,
    SUM(sd.total_local) AS total_sales_local,
    
    -- Ventas por tipo de documento
    SUM(CASE WHEN sd.doc_type = '01' THEN sd.total_local ELSE 0 END) AS facturas_sales,
    SUM(CASE WHEN sd.doc_type = '03' THEN sd.total_local ELSE 0 END) AS boletas_sales,
    SUM(CASE WHEN sd.doc_type NOT IN ('01','03') THEN sd.total_local ELSE 0 END) AS otros_sales,
    
    -- Conteos por tipo
    COUNT(CASE WHEN sd.doc_type = '01' THEN 1 END) AS facturas_count,
    COUNT(CASE WHEN sd.doc_type = '03' THEN 1 END) AS boletas_count,
    COUNT(CASE WHEN sd.doc_type NOT IN ('01','03') THEN 1 END) AS otros_count,
    
    -- Ticket promedio del canal
    AVG(sd.total_local) AS avg_ticket_value,
    
    -- Participación en ventas totales de la empresa ese mes
    SUM(sd.total_local) / SUM(SUM(sd.total_local)) OVER (
        PARTITION BY sd.company_id, DATE_TRUNC('month', sd.issue_date)
    ) * 100 AS channel_share_percent

FROM sales_docs sd
JOIN companies c ON sd.company_id = c.id
LEFT JOIN branches br ON sd.branch_id = br.id
LEFT JOIN auth.users u ON sd.created_by = u.id
LEFT JOIN public.profiles prof ON u.id = prof.id
WHERE sd.deleted_at IS NULL
GROUP BY 
    sd.company_id, c.legal_name,
    DATE_TRUNC('month', sd.issue_date),
    EXTRACT(YEAR FROM sd.issue_date),
    EXTRACT(MONTH FROM sd.issue_date),
    sd.branch_id, br.name, br.code,
    sd.created_by, prof.first_name, prof.last_name, u.email
ORDER BY sale_month DESC, total_sales_local DESC;

-- ============================================================================
-- 4. VISTA DE MÉTRICAS DE RENTABILIDAD MENSUALES (mv_profitability_metrics_monthly)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_profitability_metrics_monthly AS
WITH product_costs AS (
    -- Obtener costos promedios de productos por mes
    SELECT 
        sl.company_id,
        sl.product_id,
        DATE_TRUNC('month', sl.movement_date) AS cost_month,
        AVG(sl.unit_cost_out) AS avg_unit_cost,
        SUM(sl.qty_out * sl.unit_cost_out) / NULLIF(SUM(sl.qty_out), 0) AS weighted_avg_cost
    FROM stock_ledger sl
    WHERE sl.qty_out > 0 AND sl.deleted_at IS NULL
    GROUP BY sl.company_id, sl.product_id, DATE_TRUNC('month', sl.movement_date)
),
monthly_profitability AS (
    SELECT
        sd.company_id,
        DATE_TRUNC('month', sd.issue_date) AS sale_month,
        
        -- Ventas totales
        SUM(sd.total_local) AS total_revenue,
        SUM(sdi.quantity * sdi.unit_price_local) AS gross_sales,
        SUM(sd.total_descuentos) AS total_discounts,
        SUM(sd.total_igv_local) AS total_taxes,
        
        -- Costos (usando stock_ledger o estimación)
        COALESCE(
            SUM(sdi.quantity * COALESCE(pc.weighted_avg_cost, pc.avg_unit_cost, sdi.unit_price_local * 0.7)),
            SUM(sdi.quantity * sdi.unit_price_local * 0.7)
        ) AS total_cogs,
        
        -- Métricas por producto
        COUNT(DISTINCT sdi.product_id) AS unique_products,
        SUM(sdi.quantity) AS total_quantity_sold,
        
        -- Métricas por cliente
        COUNT(DISTINCT sd.customer_id) AS unique_customers,
        COUNT(DISTINCT sd.id) AS total_transactions

    FROM sales_docs sd
    JOIN sales_doc_items sdi ON sd.id = sdi.sales_doc_id
    LEFT JOIN product_costs pc ON pc.company_id = sd.company_id 
        AND pc.product_id = sdi.product_id 
        AND pc.cost_month = DATE_TRUNC('month', sd.issue_date)
    WHERE sd.deleted_at IS NULL
    GROUP BY sd.company_id, DATE_TRUNC('month', sd.issue_date)
)
SELECT
    mp.company_id,
    c.legal_name AS company_name,
    mp.sale_month,
    EXTRACT(YEAR FROM mp.sale_month) AS sale_year,
    EXTRACT(MONTH FROM mp.sale_month) AS month_number,
    
    -- Métricas de ventas
    mp.total_revenue,
    mp.gross_sales,
    mp.total_discounts,
    mp.total_taxes,
    mp.total_cogs,
    
    -- Rentabilidad
    (mp.total_revenue - mp.total_cogs) AS gross_profit,
    (mp.total_revenue - mp.total_cogs - mp.total_taxes) AS net_profit,
    
    -- Márgenes
    CASE 
        WHEN mp.total_revenue > 0 THEN ((mp.total_revenue - mp.total_cogs) / mp.total_revenue) * 100
        ELSE 0
    END AS gross_margin_percent,
    
    CASE 
        WHEN mp.total_revenue > 0 THEN ((mp.total_revenue - mp.total_cogs - mp.total_taxes) / mp.total_revenue) * 100
        ELSE 0
    END AS net_margin_percent,
    
    -- ROI estimado (ganancia sobre costo)
    CASE 
        WHEN mp.total_cogs > 0 THEN ((mp.total_revenue - mp.total_cogs) / mp.total_cogs) * 100
        ELSE 0
    END AS roi_percent,
    
    -- Métricas operativas
    mp.unique_products,
    mp.total_quantity_sold,
    mp.unique_customers,
    mp.total_transactions,
    
    -- Métricas por unidad
    CASE 
        WHEN mp.total_transactions > 0 THEN mp.total_revenue / mp.total_transactions
        ELSE 0
    END AS avg_transaction_value,
    
    CASE 
        WHEN mp.unique_customers > 0 THEN mp.total_revenue / mp.unique_customers
        ELSE 0
    END AS avg_customer_value,
    
    CASE 
        WHEN mp.total_quantity_sold > 0 THEN mp.total_revenue / mp.total_quantity_sold
        ELSE 0
    END AS avg_price_per_unit,
    
    -- Eficiencia de inventario
    CASE 
        WHEN mp.unique_products > 0 THEN mp.total_quantity_sold / mp.unique_products
        ELSE 0
    END AS avg_qty_per_product

FROM monthly_profitability mp
JOIN companies c ON mp.company_id = c.id
ORDER BY mp.company_id, mp.sale_month DESC;

-- ============================================================================
-- ÍNDICES ÚNICOS PARA VISTAS MATERIALIZADAS (REFRESH CONCURRENTLY)
-- ============================================================================

-- Índices únicos para mv_sales_profit_monthly
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_profit_monthly_unique
ON mv_sales_profit_monthly (company_id, sale_month);

-- Índices únicos para mv_sales_trend_monthly  
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_trend_monthly_unique
ON mv_sales_trend_monthly (company_id, sale_month);

-- Índices únicos para mv_sales_channel_monthly
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_sales_channel_monthly_unique
ON mv_sales_channel_monthly (company_id, sale_month, sales_channel, seller_user_id, branch_id);

-- Índices únicos para mv_profitability_metrics_monthly
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_profitability_metrics_monthly_unique
ON mv_profitability_metrics_monthly (company_id, sale_month);

-- ============================================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================================

-- Índices por company_id y fecha
CREATE INDEX IF NOT EXISTS idx_mv_sales_profit_monthly_company_year 
ON mv_sales_profit_monthly (company_id, sale_year);

CREATE INDEX IF NOT EXISTS idx_mv_sales_trend_monthly_company_year
ON mv_sales_trend_monthly (company_id, sale_year);

CREATE INDEX IF NOT EXISTS idx_mv_sales_channel_monthly_channel
ON mv_sales_channel_monthly (company_id, sales_channel, sale_month);

CREATE INDEX IF NOT EXISTS idx_mv_profitability_metrics_monthly_margins
ON mv_profitability_metrics_monthly (company_id, gross_margin_percent, net_margin_percent);

-- ============================================================================
-- FUNCIÓN ACTUALIZADA PARA REFRESCAR TODAS LAS VISTAS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_enhanced_sales_materialized_views()
RETURNS void AS $$
DECLARE
    view_record RECORD;
    error_msg TEXT;
BEGIN
    -- Lista actualizada de vistas en el orden correcto de dependencias
    FOR view_record IN 
        SELECT unnest(ARRAY[
            'mv_sales_dashboard_base',
            'mv_sales_by_time_period', 
            'mv_sales_by_seller',
            'mv_sales_by_product',
            'mv_sales_by_customer', 
            'mv_sales_by_branch',
            'mv_sales_monthly_trend',
            'mv_sales_profit_monthly',
            'mv_sales_trend_monthly',
            'mv_sales_channel_monthly',
            'mv_profitability_metrics_monthly'
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
    
    RAISE NOTICE 'All enhanced sales dashboard views have been refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISOS Y COMENTARIOS
-- ============================================================================

-- Permisos para las nuevas funciones
GRANT EXECUTE ON FUNCTION refresh_enhanced_sales_materialized_views() TO authenticated;

-- Comentarios para documentación
COMMENT ON MATERIALIZED VIEW mv_sales_profit_monthly IS 'Vista mensual de ganancias y rentabilidad por empresa';
COMMENT ON MATERIALIZED VIEW mv_sales_trend_monthly IS 'Vista de tendencias mensuales con comparativas MoM y YoY';
COMMENT ON MATERIALIZED VIEW mv_sales_channel_monthly IS 'Vista de análisis por canales de venta (sucursales, vendedores)';
COMMENT ON MATERIALIZED VIEW mv_profitability_metrics_monthly IS 'Vista de métricas detalladas de rentabilidad y ROI';

COMMENT ON FUNCTION refresh_enhanced_sales_materialized_views() IS 'Refresca todas las vistas materializadas del dashboard de ventas incluyendo las nuevas vistas avanzadas';