-- Add main_image field to get_inventory_items function
CREATE OR REPLACE FUNCTION get_inventory_items(
    p_company_id UUID DEFAULT NULL,
    p_warehouse_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    warehouse_id UUID,
    warehouse_name TEXT,
    balance_qty NUMERIC(18,6),
    reserved_qty NUMERIC(18,6),
    available_qty NUMERIC(18,6),
    average_cost NUMERIC(18,6),
    original_currency TEXT,
    min_stock NUMERIC(18,6),
    max_stock NUMERIC(18,6),
    main_image TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH reserved AS (
        SELECT soi.product_id,
               so.company_id,
               SUM(soi.quantity) AS reserved_qty
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        WHERE (p_company_id IS NULL OR so.company_id = p_company_id)
          AND so.status IN ('PENDING','APPROVED')
        GROUP BY soi.product_id, so.company_id
    ),
    latest_cost AS (
        SELECT
            sl.product_id,
            sl.warehouse_id,
            sl.balance_unit_cost,
            sl.original_currency_code::TEXT as original_currency_code,
            ROW_NUMBER() OVER (
                PARTITION BY sl.product_id, sl.warehouse_id
                ORDER BY sl.movement_date DESC, sl.created_at DESC
            ) as rn
        FROM stock_ledger sl
        WHERE (p_company_id IS NULL OR sl.company_id = p_company_id)
    )
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        w.id AS warehouse_id,
        w.name AS warehouse_name,
        ws.balance_qty::NUMERIC(18,6),
        COALESCE(r.reserved_qty, 0)::NUMERIC(18,6) AS reserved_qty,
        (ws.balance_qty - COALESCE(r.reserved_qty, 0))::NUMERIC(18,6) AS available_qty,
        COALESCE(lc.balance_unit_cost, 0)::NUMERIC(18,6) AS average_cost,
        COALESCE(lc.original_currency_code, 'PEN') AS original_currency,
        p.min_stock::NUMERIC(18,6) AS min_stock,
        p.max_stock::NUMERIC(18,6) AS max_stock,
        -- Main image from product_images table
        (SELECT pi.storage_path
         FROM product_images pi
         WHERE pi.product_id = p.id
           AND pi.is_primary = true
         LIMIT 1) AS main_image
    FROM warehouse_stock ws
    JOIN warehouses w ON w.id = ws.warehouse_id
    JOIN products p ON p.id = ws.product_id
    LEFT JOIN reserved r
           ON r.product_id = p.id
          AND r.company_id = p.company_id
    LEFT JOIN latest_cost lc
           ON lc.product_id = p.id
          AND lc.warehouse_id = w.id
          AND lc.rn = 1
    WHERE (p_company_id IS NULL OR p.company_id = p_company_id)
      AND (p_warehouse_id IS NULL OR w.id = p_warehouse_id)
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND p.active = true
    ORDER BY w.name, p.name;
END;
$$;
