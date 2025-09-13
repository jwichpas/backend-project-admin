CREATE MATERIALIZED VIEW mv_sales_dashboard_base AS
SELECT
    sd.id AS sales_doc_id,
    sd.company_id,
    c.legal_name AS company_name,
    sd.issue_date,
    DATE_TRUNC('day', sd.issue_date) AS sale_day,
    DATE_TRUNC('week', sd.issue_date) AS sale_week,
    DATE_TRUNC('month', sd.issue_date) AS sale_month,
    DATE_TRUNC('quarter', sd.issue_date) AS sale_quarter,
    DATE_TRUNC('year', sd.issue_date) AS sale_year,
    EXTRACT(DOW FROM sd.issue_date) AS day_of_week,
    EXTRACT(MONTH FROM sd.issue_date) AS month_of_year,
    sd.branch_id,
    br.name AS branch_name,
    sd.customer_id,
    p.fullname AS customer_name,
    p.doc_type AS customer_doc_type,
    p.doc_number AS customer_doc_number,
    sd.doc_type,
    sdt.descripcion AS document_type_name,
    sd.series,
    sd.number,
    sd.currency_code,
    sd.total_ope_gravadas,
    sd.total_ope_exoneradas,
    sd.total_ope_inafectas,
    sd.total_igv,
    sd.total_isc,
    sd.total_descuentos,
    sd.total_otros_cargos,
    sd.total,
    sd.total_local,
    sd.total_usd,
    sd.total_clp,
    sd.created_by AS seller_user_id,
    u.email AS seller_email,
    COALESCE(prof.first_name || ' ' || prof.last_name, u.email) AS seller_name,
    sdi.product_id,
    prod.name AS product_name,
    prod.sku,
    prod.category_id,
    cat.name AS category_name,
    prod.brand_id,
    b.name AS brand_name,
    sdi.quantity,
    sdi.unit_price,
    sdi.discount_amount,
    sdi.discount_pct,
    sdi.total_line AS item_total_amount,
    sdi.total_line_local AS item_total_local,
    sdi.total_line_usd AS item_total_usd,
    sdi.total_line_clp AS item_total_clp,
    sd.created_at,
    sd.updated_at
FROM sales_docs sd
JOIN sales_doc_items sdi ON sd.id = sdi.sales_doc_id
JOIN companies c ON sd.company_id = c.id
LEFT JOIN parties p ON sd.customer_id = p.id
LEFT JOIN products prod ON sdi.product_id = prod.id
LEFT JOIN categories cat ON prod.category_id = cat.id
LEFT JOIN brands b ON prod.brand_id = b.id
LEFT JOIN branches br ON sd.branch_id = br.id
LEFT JOIN auth.users u ON sd.created_by = u.id
LEFT JOIN public.profiles prof ON u.id = prof.id
LEFT JOIN sunat.cat_01_tipo_documento sdt ON sd.doc_type = sdt.code
WHERE sd.deleted_at IS NULL;


-- 2. Índices para Optimizar el Rendimiento
CREATE INDEX idx_mv_sales_base_company ON mv_sales_dashboard_base (company_id);
CREATE INDEX idx_mv_sales_base_date ON mv_sales_dashboard_base (issue_date);
CREATE INDEX idx_mv_sales_base_month ON mv_sales_dashboard_base (sale_month);
CREATE INDEX idx_mv_sales_base_year ON mv_sales_dashboard_base (sale_year);
CREATE INDEX idx_mv_sales_base_seller ON mv_sales_dashboard_base (seller_user_id);
CREATE INDEX idx_mv_sales_base_customer ON mv_sales_dashboard_base (customer_id);
CREATE INDEX idx_mv_sales_base_product ON mv_sales_dashboard_base (product_id);
CREATE INDEX idx_mv_sales_base_category ON mv_sales_dashboard_base (category_id);
CREATE INDEX idx_mv_sales_base_branch ON mv_sales_dashboard_base (branch_id);

-- Ventas por Período de Tiempo
CREATE MATERIALIZED VIEW mv_sales_by_time_period AS
SELECT
    company_id,
    company_name,
    sale_day,
    sale_week,
    sale_month,
    sale_quarter,
    sale_year,
    day_of_week,
    month_of_year,
    COUNT(DISTINCT sales_doc_id) AS total_transactions,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(total) AS total_sales,
    SUM(total_local) AS total_sales_local,
    SUM(total_usd) AS total_sales_usd,
    SUM(total_clp) AS total_sales_clp,
    SUM(total_ope_gravadas) AS total_taxable_sales,
    SUM(total_igv) AS total_tax,
    AVG(total) AS avg_transaction_value,
    SUM(quantity) AS total_items_sold
FROM mv_sales_dashboard_base
GROUP BY 
    company_id, company_name, sale_day, sale_week, sale_month, 
    sale_quarter, sale_year, day_of_week, month_of_year;

-- Ventas por Vendedor
CREATE MATERIALIZED VIEW mv_sales_by_seller AS
SELECT
    company_id,
    company_name,
    seller_user_id,
    seller_email,
    seller_name,
    sale_month,
    sale_quarter,
    sale_year,
    COUNT(DISTINCT sales_doc_id) AS total_transactions,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(total) AS total_sales,
    SUM(total_local) AS total_sales_local,
    AVG(total) AS avg_transaction_value,
    SUM(quantity) AS total_items_sold,
    RANK() OVER (PARTITION BY company_id, sale_month ORDER BY SUM(total) DESC) AS monthly_rank
FROM mv_sales_dashboard_base
GROUP BY 
    company_id, company_name, seller_user_id, seller_email, 
    seller_name, sale_month, sale_quarter, sale_year;

-- Ventas por Producto y Categoría
CREATE MATERIALIZED VIEW mv_sales_by_product AS
SELECT
    company_id,
    company_name,
    product_id,
    product_name,
    sku,
    category_id,
    category_name,
    brand_id,
    brand_name,
    sale_month,
    sale_quarter,
    sale_year,
    SUM(quantity) AS total_quantity_sold,
    SUM(item_total_amount) AS total_sales_value,
    SUM(item_total_local) AS total_sales_local,
    AVG(unit_price) AS avg_unit_price,
    RANK() OVER (PARTITION BY company_id, sale_month ORDER BY SUM(quantity) DESC) AS monthly_quantity_rank,
    RANK() OVER (PARTITION BY company_id, sale_month ORDER BY SUM(item_total_amount) DESC) AS monthly_value_rank
FROM mv_sales_dashboard_base
GROUP BY 
    company_id, company_name, product_id, product_name, sku, 
    category_id, category_name, brand_id, brand_name, 
    sale_month, sale_quarter, sale_year;

-- Ventas por Cliente
CREATE MATERIALIZED VIEW mv_sales_by_customer AS
SELECT
    company_id,
    company_name,
    customer_id,
    customer_name,
    customer_doc_type,
    customer_doc_number,
    sale_month,
    sale_quarter,
    sale_year,
    COUNT(DISTINCT sales_doc_id) AS total_transactions,
    SUM(total) AS total_sales_value,
    SUM(total_local) AS total_sales_local,
    AVG(total) AS avg_transaction_value,
    SUM(quantity) AS total_items_purchased,
    RANK() OVER (PARTITION BY company_id, sale_month ORDER BY SUM(total) DESC) AS monthly_rank
FROM mv_sales_dashboard_base
GROUP BY 
    company_id, company_name, customer_id, customer_name, 
    customer_doc_type, customer_doc_number, sale_month, 
    sale_quarter, sale_year;

-- Ventas por Sucursal
CREATE MATERIALIZED VIEW mv_sales_by_branch AS
SELECT
    company_id,
    company_name,
    branch_id,
    branch_name,
    sale_month,
    sale_quarter,
    sale_year,
    COUNT(DISTINCT sales_doc_id) AS total_transactions,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT seller_user_id) AS unique_sellers,
    SUM(total) AS total_sales_value,
    SUM(total_local) AS total_sales_local,
    AVG(total) AS avg_transaction_value,
    SUM(quantity) AS total_items_sold
FROM mv_sales_dashboard_base
GROUP BY 
    company_id, company_name, branch_id, branch_name, 
    sale_month, sale_quarter, sale_year;

-- Tendencia de Ventas Mensual
CREATE MATERIALIZED VIEW mv_sales_monthly_trend AS
SELECT
    company_id,
    company_name,
    sale_month,
    sale_year,
    COUNT(DISTINCT sales_doc_id) AS total_transactions,
    SUM(total) AS total_sales,
    SUM(total_local) AS total_sales_local,
    LAG(SUM(total), 1) OVER (PARTITION BY company_id ORDER BY sale_month) AS previous_month_sales,
    CASE 
        WHEN LAG(SUM(total), 1) OVER (PARTITION BY company_id ORDER BY sale_month) > 0 
        THEN (SUM(total) - LAG(SUM(total), 1) OVER (PARTITION BY company_id ORDER BY sale_month)) / 
             LAG(SUM(total), 1) OVER (PARTITION BY company_id ORDER BY sale_month) * 100 
        ELSE NULL 
    END AS growth_percentage,
    SUM(quantity) AS total_items_sold
FROM mv_sales_dashboard_base
GROUP BY company_id, company_name, sale_month, sale_year;

--  Función para Actualizar las Vistas Materializadas

CREATE OR REPLACE FUNCTION refresh_sales_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_dashboard_base;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_time_period;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_seller;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_product;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_customer;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_branch;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_monthly_trend;
END;
$$ LANGUAGE plpgsql;


-- Vista Materializada de Ventas y Ganancias Mensuales

CREATE MATERIALIZED VIEW mv_sales_profit_monthly AS
SELECT
    sd.company_id,
    DATE_TRUNC('month', sd.issue_date) AS sale_month,
    EXTRACT(YEAR FROM DATE_TRUNC('month', sd.issue_date)) AS sale_year,
    EXTRACT(MONTH FROM DATE_TRUNC('month', sd.issue_date)) AS sale_month_number,
    TO_CHAR(DATE_TRUNC('month', sd.issue_date), 'Month') AS sale_month_name,
    COUNT(DISTINCT sd.id) AS total_transactions,
    COUNT(DISTINCT sd.customer_id) AS unique_customers,
    SUM(sd.total) AS total_sales,
    SUM(sd.total_local) AS total_sales_local,
    SUM(sd.total_usd) AS total_sales_usd,
    SUM(sd.total_clp) AS total_sales_clp,
    SUM(sd.total_ope_gravadas) AS taxable_sales,
    SUM(sd.total_ope_exoneradas) AS exempt_sales,
    SUM(sd.total_ope_inafectas) AS non_taxable_sales,
    SUM(sd.total_igv) AS total_tax,
    SUM(sd.total_isc) AS total_excise_tax,
    SUM(sd.total_descuentos) AS total_discounts,
    SUM(sd.total_otros_cargos) AS total_other_charges,
    -- Cálculo de ganancias mejorado
    (SUM(sd.total) - COALESCE(SUM(sl.total_cost_out), 0)) AS estimated_profit,
    (SUM(sd.total_local) - COALESCE(SUM(sl.total_cost_out_local), 0)) AS estimated_profit_local
FROM sales_docs sd
LEFT JOIN (
    SELECT 
        company_id,
        DATE_TRUNC('month', movement_date) AS movement_month,
        SUM(total_cost_out) AS total_cost_out,
        SUM(total_cost_out_local) AS total_cost_out_local
    FROM stock_ledger
    WHERE operation_type = '01'
    GROUP BY company_id, DATE_TRUNC('month', movement_date)
) sl ON sd.company_id = sl.company_id 
    AND DATE_TRUNC('month', sd.issue_date) = sl.movement_month
WHERE sd.deleted_at IS NULL
GROUP BY 
    sd.company_id,
    DATE_TRUNC('month', sd.issue_date);

-- Vista Materializada de Tendencia Mensual
CREATE MATERIALIZED VIEW mv_sales_trend_monthly AS
WITH monthly_sales AS (
    SELECT
        company_id,
        DATE_TRUNC('month', issue_date) AS sale_month,
        SUM(total) AS monthly_sales,
        LAG(SUM(total), 1) OVER (
            PARTITION BY company_id ORDER BY DATE_TRUNC('month', issue_date)
        ) AS previous_month_sales,
        LAG(SUM(total), 12) OVER (
            PARTITION BY company_id ORDER BY DATE_TRUNC('month', issue_date)
        ) AS previous_year_sales
    FROM sales_docs
    WHERE deleted_at IS NULL
    GROUP BY company_id, DATE_TRUNC('month', issue_date)
)
SELECT
    company_id,
    sale_month,
    EXTRACT(YEAR FROM sale_month) AS sale_year,
    EXTRACT(MONTH FROM sale_month) AS sale_month_number,
    monthly_sales,
    previous_month_sales,
    previous_year_sales,
    CASE 
        WHEN previous_month_sales > 0 
        THEN ((monthly_sales - previous_month_sales) / previous_month_sales) * 100 
        ELSE NULL 
    END AS month_over_month_growth,
    CASE 
        WHEN previous_year_sales > 0 
        THEN ((monthly_sales - previous_year_sales) / previous_year_sales) * 100 
        ELSE NULL 
    END AS year_over_year_growth
FROM monthly_sales;

-- Vista Materializada de Ventas por Canal Mensual

CREATE MATERIALIZED VIEW mv_sales_channel_monthly AS
SELECT
    company_id,
    DATE_TRUNC('month', issue_date) AS sale_month,
    doc_type,
    COUNT(DISTINCT id) AS transaction_count,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(total) AS total_sales,
    SUM(total_local) AS total_sales_local,
    AVG(total) AS avg_transaction_value,
    SUM(total_igv) AS total_tax
FROM sales_docs
WHERE deleted_at IS NULL
GROUP BY company_id, DATE_TRUNC('month', issue_date), doc_type;

-- Vista Materializada de Métricas de Rentabilidad Mensual
CREATE MATERIALIZED VIEW mv_profitability_metrics_monthly AS
SELECT
    sd.company_id,
    DATE_TRUNC('month', sd.issue_date) AS sale_month,
    EXTRACT(YEAR FROM sd.issue_date) AS sale_year,
    EXTRACT(MONTH FROM sd.issue_date) AS sale_month_number,
    
    -- Ventas
    SUM(sd.total) AS total_sales,
    
    -- Costo de ventas (estimado desde stock_ledger)
    COALESCE(SUM(sl.total_cost_out), 0) AS cost_of_goods_sold,
    
    -- Margen bruto
    SUM(sd.total) - COALESCE(SUM(sl.total_cost_out), 0) AS gross_profit,
    
    -- Margen bruto porcentual
    CASE 
        WHEN SUM(sd.total) > 0 
        THEN ((SUM(sd.total) - COALESCE(SUM(sl.total_cost_out), 0)) / SUM(sd.total)) * 100 
        ELSE 0 
    END AS gross_margin_percentage,
    
    -- Impuestos
    SUM(sd.total_igv) AS total_taxes,
    
    -- Descuentos
    SUM(sd.total_descuentos) AS total_discounts,
    
    -- Otras métricas
    COUNT(DISTINCT sd.id) AS transaction_count,
    AVG(sd.total) AS avg_transaction_value
FROM sales_docs sd
LEFT JOIN (
    SELECT 
        company_id,
        DATE_TRUNC('month', movement_date) AS movement_month,
        SUM(total_cost_out) AS total_cost_out
    FROM stock_ledger
    WHERE operation_type = '01' -- Operaciones de venta
    GROUP BY company_id, DATE_TRUNC('month', movement_date)
) sl ON sd.company_id = sl.company_id AND DATE_TRUNC('month', sd.issue_date) = sl.movement_month
WHERE sd.deleted_at IS NULL
GROUP BY sd.company_id, DATE_TRUNC('month', sd.issue_date), 
         EXTRACT(YEAR FROM sd.issue_date), EXTRACT(MONTH FROM sd.issue_date);

CREATE INDEX idx_mv_sales_profit_monthly ON mv_sales_profit_monthly (company_id, sale_month);
CREATE INDEX idx_mv_sales_trend_monthly ON mv_sales_trend_monthly (company_id, sale_month);
CREATE INDEX idx_mv_sales_channel_monthly ON mv_sales_channel_monthly (company_id, sale_month, doc_type);
CREATE INDEX idx_mv_profitability_metrics ON mv_profitability_metrics_monthly (company_id, sale_month);

CREATE OR REPLACE FUNCTION refresh_sales_profit_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_profit_monthly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_trend_monthly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_channel_monthly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profitability_metrics_monthly;
END;
$$ LANGUAGE plpgsql;