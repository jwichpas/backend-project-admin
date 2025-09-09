-- PASO 5: EMPRESAS CON ENCRIPTACIÓN Y AUDITORÍA (VERSIÓN OPTIMIZADA)
-- ============================================================================
-- Función para encriptar datos sensibles
CREATE OR REPLACE FUNCTION encrypt_sensitive_company_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Encriptar contraseña SOL si está presente
    IF NEW.sol_pass IS NOT NULL AND NEW.sol_pass != OLD.sol_pass THEN
        NEW.sol_pass = crypt(NEW.sol_pass, gen_salt('bf', 8));
    END IF;

    -- Encriptar client_secret si está presente
    IF NEW.client_secret IS NOT NULL AND NEW.client_secret != OLD.client_secret THEN
        NEW.client_secret = pgp_sym_encrypt(NEW.client_secret, 'empresa_secret_key');
    END IF;

    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_encrypt_company_data
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sensitive_company_data();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 9: MARCAS, CATEGORÍAS Y PRODUCTOS (FUSIONADO Y OPTIMIZADO)
-- ============================================================================

-- Procedimiento para calcular niveles iniciales en categorías
DO $$
DECLARE
  r RECORD;
  v_level int;
BEGIN
  FOR r IN SELECT id, parent_id FROM public.categories LOOP
    v_level := 0;
    WITH RECURSIVE anc(cur_id, depth) AS (
      SELECT r.parent_id, 1
      UNION ALL
      SELECT c.parent_id, depth + 1
      FROM public.categories c
      JOIN anc a ON c.id = a.cur_id
      WHERE c.parent_id IS NOT NULL
    )
    SELECT COALESCE(MAX(depth), 0) INTO v_level FROM anc;

    UPDATE public.categories SET level = v_level WHERE id = r.id;
  END LOOP;
END $$
;

-- Trigger para actualizar search_vector
CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_products_search_vector
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_search_vector();

-- Esto evita conflictos de concurrencia en ventas o facturación electrónica:
CREATE OR REPLACE FUNCTION public.next_document_number(
    p_company_id UUID,
    p_document_type_code VARCHAR,
    p_series VARCHAR
)
RETURNS BIGINT AS $$
DECLARE
    new_number BIGINT;
BEGIN
    UPDATE public.document_counters
    SET last_number = last_number + 1,
        updated_at = now()
    WHERE company_id = p_company_id
      AND document_type_code = p_document_type_code
      AND series = p_series
    RETURNING last_number INTO new_number;

    IF new_number IS NULL THEN
        INSERT INTO public.document_counters(company_id, document_type_code, series, last_number)
        VALUES (p_company_id, p_document_type_code, p_series, 1)
        RETURNING last_number INTO new_number;
    END IF;

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- PASO 21: FUNCIONES DE APLICACIÓN Y HELPERS (FUSIONADO)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_company_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_companies uc
        JOIN public.roles r ON r.id = uc.role_id
        WHERE uc.user_id = p_user_id
          AND uc.company_id = p_company_id
          AND uc.is_active = true
          AND (uc.valid_until IS NULL OR uc.valid_until > NOW())
          AND (
              r.permissions ? '*'
              OR r.permissions ? p_permission
              OR uc.permissions_override ? p_permission
          )
    );
$$;
-- Función para obtener las empresas de un usuario
CREATE OR REPLACE FUNCTION public.get_user_companies(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    company_id UUID,
    company_name TEXT,
    ruc TEXT,
    role_name TEXT,
    permissions JSONB,
    is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        c.id,
        c.legal_name,
        c.ruc,
        r.name,
        r.permissions,
        uc.is_active
    FROM public.user_companies uc
    JOIN public.companies c ON c.id = uc.company_id
    JOIN public.roles r ON r.id = uc.role_id
    WHERE uc.user_id = p_user_id
      AND uc.is_active = true
      AND (uc.valid_until IS NULL OR uc.valid_until > NOW())
    ORDER BY c.legal_name;
$$;

-- ==================== STOCK LEDGER
-- PASO 15: FUNCIONES OPTIMIZADAS PARA CÁLCULO DE INVENTARIO
-- ============================================================================

-- calcular los balances de la nueva fila en el momento de insertarla.
-- registros del mismo día insertados previamente.
CREATE OR REPLACE FUNCTION compute_stock_ledger_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prev_qty numeric(18,6) := 0;
  prev_total numeric(18,6) := 0;
  prev_unit numeric(18,6) := 0;
  valuation_method text;
BEGIN
  -- Obtener método de valuación de la empresa
  SELECT c.valuation_method INTO valuation_method
  FROM companies c
  WHERE c.id = NEW.company_id;

  -- Obtener el último balance válido (excluyendo registros eliminados y el actual)
  SELECT COALESCE(balance_qty, 0), COALESCE(balance_total_cost, 0), COALESCE(balance_unit_cost, 0)
  INTO prev_qty, prev_total, prev_unit
  FROM stock_ledger
  WHERE company_id = NEW.company_id
    AND warehouse_id = NEW.warehouse_id
    AND product_id = NEW.product_id
    AND deleted_at IS NULL
    AND (movement_date < NEW.movement_date 
         OR (movement_date = NEW.movement_date AND created_at < clock_timestamp()))
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  -- Calcular costos si son nulos
  IF NEW.qty_in > 0 AND NEW.total_cost_in IS NULL THEN
    NEW.total_cost_in := NEW.qty_in * COALESCE(NEW.unit_cost_in, 0);
  END IF;
  IF NEW.qty_out > 0 AND NEW.total_cost_out IS NULL THEN
    NEW.unit_cost_out := prev_unit;
    NEW.total_cost_out := NEW.qty_out * NEW.unit_cost_out;
  END IF;

  -- Depuración: mostrar valores previos y nuevos
  RAISE NOTICE 'prev_qty: %, prev_total: %, prev_unit: %', prev_qty, prev_total, prev_unit;
  RAISE NOTICE 'NEW.qty_in: %, NEW.total_cost_in: %, NEW.unit_cost_in: %', NEW.qty_in, NEW.total_cost_in, NEW.unit_cost_in;
  RAISE NOTICE 'NEW.qty_out: %, NEW.total_cost_out: %, NEW.unit_cost_out: %', NEW.qty_out, NEW.total_cost_out, NEW.unit_cost_out;
  RAISE NOTICE 'valuation_method: %', valuation_method;

  -- Calcular nuevos balances según el método de valuación
  
  IF NEW.qty_in > 0 THEN
    NEW.balance_qty := prev_qty + NEW.qty_in;
    NEW.balance_total_cost := prev_total + COALESCE(NEW.total_cost_in, 0);
    NEW.balance_unit_cost := CASE 
      WHEN NEW.balance_qty > 0 THEN NEW.balance_total_cost / NEW.balance_qty 
      ELSE 0 
    END;
  ELSIF NEW.qty_out > 0 THEN
    NEW.balance_qty := GREATEST(prev_qty - NEW.qty_out, 0);
    NEW.balance_total_cost := GREATEST(prev_total - COALESCE(NEW.total_cost_out, 0), 0);
    NEW.balance_unit_cost := CASE 
      WHEN NEW.balance_qty > 0 THEN NEW.balance_total_cost / NEW.balance_qty 
      ELSE 0 
    END;
  END IF;

  -- Asegurar que los balances no sean nulos
  NEW.balance_qty := COALESCE(NEW.balance_qty, 0);
  NEW.balance_total_cost := COALESCE(NEW.balance_total_cost, 0);
  NEW.balance_unit_cost := COALESCE(NEW.balance_unit_cost, 0);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_compute_stock_ledger_balances ON stock_ledger;
CREATE TRIGGER trigger_compute_stock_ledger_balances
BEFORE INSERT ON stock_ledger
FOR EACH ROW
EXECUTE FUNCTION compute_stock_ledger_balances();

-- Función para manejar el caso especial del primer registro después de una actualización.
-- Solo actualiza los balances si es el primer registro y los valores no coinciden.
-- Función para manejar el caso especial del primer registro antes de la inserción.
-- Modifica directamente NEW si es el primer registro, asegurando que los balances coincidan exactamente con los valores de entrada.

-- Función que ejecuta la lógica
CREATE OR REPLACE FUNCTION fix_stock_ledger_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Buscar filas con balance_qty = 0, operación 02 y que sean únicas por empresa, almacén y producto
    FOR rec IN
        SELECT DISTINCT ON (company_id, warehouse_id, product_id)
               id, company_id, warehouse_id, product_id,
               qty_in, unit_cost_in, total_cost_in
        FROM stock_ledger
        WHERE balance_qty = 0
          AND operation_type = '02'
        ORDER BY company_id, warehouse_id, product_id, created_at DESC
    LOOP
        -- Actualizar con los datos de entrada
        UPDATE stock_ledger
        SET balance_qty = rec.qty_in,
            balance_unit_cost = rec.unit_cost_in,
            balance_total_cost = rec.total_cost_in
        WHERE id = rec.id;
    END LOOP;

    RETURN NEW;
END;
$$;


-- Trigger para ejecutarlo después de cada insert
DROP TRIGGER IF EXISTS trg_fix_stock_ledger_balances ON stock_ledger;

CREATE TRIGGER trg_fix_stock_ledger_balances
AFTER INSERT ON stock_ledger
FOR EACH ROW
EXECUTE FUNCTION fix_stock_ledger_balances();



-- ============== RECOMPUTE STOCK LEDGER BALANCES =====================

-- Previene ventas sin stock suficiente
CREATE OR REPLACE FUNCTION validate_stock_before_sale(p_company_id UUID, p_warehouse_id UUID, p_product_id UUID, p_qty NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE v_available NUMERIC;
BEGIN
    SELECT balance_qty INTO v_available FROM warehouse_stock WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;
    IF v_available < p_qty THEN RAISE EXCEPTION 'Stock insuficiente para producto % en almacén %', p_product_id, p_warehouse_id; END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- offline, para recalcular hacia atrás y hacia adelante, útil cuando corriges registros o cambias datos históricos.




-- ======================= INICIO::ACTUALIZA STOCK EN ALMACENES =====================================
-- Actualizar el stock en warehouse_stock después de un movimiento en stock_ledger
-- Mantener stock de un producto en un almacén (insert/update automático)
-- Trigger que asegura sincronización en cada cambio del ledger
CREATE OR REPLACE FUNCTION trigger_sync_warehouse_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    -- Para operaciones de UPDATE o DELETE, necesitamos recalcular el último estado.
    v_last_balance_qty NUMERIC;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- En un INSERT, el balance ya fue calculado por el trigger BEFORE.
        -- Simplemente lo usamos para actualizar la tabla de stock agregado.
        INSERT INTO warehouse_stock (warehouse_id, product_id, balance_qty)
        VALUES (NEW.warehouse_id, NEW.product_id, NEW.balance_qty)
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET balance_qty = EXCLUDED.balance_qty;

    ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        -- Si se actualiza o elimina una fila, el stock agregado debe reflejar
        -- el último balance válido en el ledger para ese producto/almacén.
        -- La fila afectada podría ser la OLD o la NEW.
        
        SELECT COALESCE(balance_qty, 0)
        INTO v_last_balance_qty
        FROM stock_ledger
        WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
          AND warehouse_id = COALESCE(NEW.warehouse_id, OLD.warehouse_id)
          AND product_id = COALESCE(NEW.product_id, OLD.product_id)
          AND deleted_at IS NULL
        ORDER BY movement_date DESC, created_at DESC
        LIMIT 1;

        -- Actualizamos warehouse_stock con el último balance encontrado (o 0 si no hay ninguno).
        INSERT INTO warehouse_stock (warehouse_id, product_id, balance_qty)
        VALUES (COALESCE(NEW.warehouse_id, OLD.warehouse_id), COALESCE(NEW.product_id, OLD.product_id), COALESCE(v_last_balance_qty, 0))
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET balance_qty = EXCLUDED.balance_qty;
    END IF;

    RETURN NULL; -- AFTER triggers no necesitan devolver la fila
END;
$$;

-- No es necesario cambiar la definición del trigger, ya que la nueva función maneja todas las operaciones.
DROP TRIGGER IF EXISTS trigger_sync_warehouse_stock ON stock_ledger;
CREATE TRIGGER trigger_sync_warehouse_stock
AFTER INSERT OR UPDATE OR DELETE ON stock_ledger
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_warehouse_stock();


-- ======================= FIN::ACTUALIZA STOCK EN ALMACENES =====================================

-- ======================= INICIO::ACTUALIZA STOCK EN PRODCUTS_LOCATION ==========================
-- Actualizar product_location
CREATE OR REPLACE FUNCTION update_product_location_from_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_location_id UUID;
BEGIN
    -- Intentar actualizar la ubicación principal existente
    UPDATE product_location
    SET stock_actual = GREATEST(stock_actual + NEW.qty_in - NEW.qty_out, 0),
        updated_at = NOW()
    WHERE product_id = NEW.product_id
      AND es_principal = TRUE
    RETURNING id INTO v_location_id;

    -- Si no existe, crear una ubicación principal automáticamente
    IF NOT FOUND THEN
        INSERT INTO product_location (
            product_id,
            warehouse_zone_id,
            stock_actual,
            es_principal,
            estado,
            created_at,
            updated_at
        )
        VALUES (
            NEW.product_id,
            NULL, -- no se sabe la zona exacta, se puede actualizar luego
            COALESCE(NEW.qty_in,0) - COALESCE(NEW.qty_out,0),
            TRUE,
            TRUE,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_location_id;
    END IF;

    -- Guardar la ubicación usada en source_id (opcional)
    NEW.source_id := v_location_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_product_location
AFTER INSERT ON stock_ledger
FOR EACH ROW
EXECUTE FUNCTION update_product_location_from_ledger();

-- ======================= FIN::ACTUALIZA STOCK EN PRODCUTS_LOCATION ==========================


-- Función para revertir movimientos cuando se elimina un documento
CREATE OR REPLACE FUNCTION revert_document_in_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        -- Marcar como eliminados los movimientos relacionados con este documento
        UPDATE stock_ledger
        SET deleted_at = NOW()
        WHERE source_id = NEW.id
        AND source = TG_ARGV[0]; -- Se pasa el nombre de la tabla como argumento
    END IF;
    
    RETURN NEW;
END;
$$;

-- ====================== VEHICULOS EN TIEMPO REAL ======================

CREATE OR REPLACE FUNCTION log_vehicle_position()
RETURNS TRIGGER AS $$
DECLARE
  changed_position BOOLEAN := NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude;
  changed_speed BOOLEAN := NEW.speed_kph IS DISTINCT FROM OLD.speed_kph;
  changed_status BOOLEAN := NEW.status IS DISTINCT FROM OLD.status;
  change_type TEXT;
BEGIN
  -- Determinar el tipo de cambio
  IF changed_position AND changed_speed AND changed_status THEN
    change_type := 'multiple';
  ELSIF (changed_position AND changed_speed)
     OR (changed_position AND changed_status)
     OR (changed_speed AND changed_status) THEN
    change_type := 'multiple';
  ELSIF changed_position THEN
    change_type := 'position';
  ELSIF changed_speed THEN
    change_type := 'speed';
  ELSIF changed_status THEN
    change_type := 'status';
  ELSE
    RETURN NEW; -- No hubo cambio relevante, no insertar nada
  END IF;

  -- Insertar en vehicle_position_logs
  INSERT INTO vehicle_position_logs (
    vehicle_id,
    latitude,
    longitude,
    speed_kph,
    heading_deg,
    status,
    reported_at,
    created_at,
    change_type
  ) VALUES (
    NEW.vehicle_id,
    NEW.latitude,
    NEW.longitude,
    NEW.speed_kph,
    NEW.heading_deg,
    NEW.status,
    NEW.updated_at,
    NOW(),
    change_type
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER after_vehicle_realtime_update
AFTER UPDATE ON vehicle_realtime_status
FOR EACH ROW
EXECUTE FUNCTION log_vehicle_position();

-- Vista para obtener la última posición de cada vehículo

CREATE OR REPLACE VIEW vehicle_latest_position_view AS
SELECT
  v.id AS vehicle_id,
  v.company_id,
  v.plate,
  v.brand,
  v.model,
  v.year,
  v.own,
  v.capacity_kg,
  v.provider_party_id,
  v.created_at AS vehicle_created_at,
  v.updated_at AS vehicle_updated_at,

  p.latitude,
  p.longitude,
  p.speed_kph,
  p.heading_deg,
  p.status AS latest_status,
  p.change_type AS latest_change_type,
  p.reported_at AS last_reported_at

FROM vehicles v
LEFT JOIN LATERAL (
  SELECT
    latitude,
    longitude,
    speed_kph,
    heading_deg,
    status,
    change_type,
    reported_at
  FROM vehicle_position_logs
  WHERE vehicle_id = v.id
  ORDER BY reported_at DESC
  LIMIT 1
) p ON TRUE;

-- ============ VIEWS INVENTARIO ============
-- ============ VIEWS INVENTARIO ============
-- ============ VIEWS INVENTARIO ============
-- ============ VIEWS INVENTARIO ============

CREATE OR REPLACE VIEW v_sunat_inventory_header AS
SELECT
  c.legal_name AS denominacion_libro,
  TO_CHAR(DATE_TRUNC('month', sl.movement_date), 'YYYY-MM') AS periodo,
  c.ruc AS ruc,
  c.legal_name AS razon_social,
  COALESCE(b.name, w.name) AS establecimiento,
  p.sku AS codigo_existencia,
  p.name AS descripcion_existencia,
  p.unit_code AS unidad_medida,
  c.valuation_method AS metodo_valuacion
FROM stock_ledger sl
JOIN companies c ON c.id = sl.company_id
LEFT JOIN warehouses w ON w.id = sl.warehouse_id
LEFT JOIN branches b ON b.id = w.branch_id
JOIN products p ON p.id = sl.product_id
GROUP BY 1,2,3,4,5,6,7,8,9;

CREATE OR REPLACE VIEW v_sunat_formato_12_1 AS
SELECT
  sl.company_id,
  sl.product_id,
  sl.movement_date AS fecha_emision,
  sl.ref_doc_type AS tipo_doc,
  sl.ref_doc_series AS serie_doc,
  sl.ref_doc_number AS numero_doc,
  sl.operation_type AS tipo_operacion,
  sl.qty_in AS entradas_unid,
  sl.qty_out AS salidas_unid,
  sl.balance_qty AS saldo_final_unid
FROM stock_ledger sl
ORDER BY sl.product_id, sl.movement_date, sl.created_at;

CREATE OR REPLACE VIEW v_sunat_formato_13_1 AS
SELECT
  sl.company_id,
  sl.product_id,
  sl.movement_date AS fecha_emision,
  sl.ref_doc_type AS tipo_doc,
  sl.ref_doc_series AS serie_doc,
  sl.ref_doc_number AS numero_doc,
  sl.operation_type AS tipo_operacion,
  sl.qty_in AS entradas_cantidad,
  sl.unit_cost_in AS entradas_costo_unit,
  sl.total_cost_in AS entradas_costo_total,
  sl.qty_out AS salidas_cantidad,
  sl.unit_cost_out AS salidas_costo_unit,
  sl.total_cost_out AS salidas_costo_total,
  sl.balance_qty AS saldo_cantidad,
  sl.balance_unit_cost AS saldo_costo_unit,
  sl.balance_total_cost AS saldo_costo_total
FROM stock_ledger sl
ORDER BY sl.product_id, sl.movement_date, sl.created_at;

CREATE OR REPLACE VIEW v_sunat_formato_13_1_resumen_diario AS
SELECT company_id, product_id, movement_date,
       SUM(qty_in) entradas_cantidad,
       SUM(total_cost_in) entradas_costo_total,
       SUM(qty_out) salidas_cantidad,
       SUM(total_cost_out) salidas_costo_total
FROM stock_ledger
GROUP BY company_id, product_id, movement_date;


-- Nueva vista: Stock actual por producto y almacén
CREATE OR REPLACE VIEW v_current_stock AS
SELECT 
  ws.warehouse_id,
  w.name AS warehouse_name,
  b.name AS branch_name,
  ws.product_id,
  p.sku,
  p.name AS product_name,
  p.unit_code,
  ws.balance_qty,
  COALESCE(sl.balance_unit_cost, 0) AS unit_cost,
  (ws.balance_qty * COALESCE(sl.balance_unit_cost, 0)) AS total_cost
FROM warehouse_stock ws
JOIN warehouses w ON w.id = ws.warehouse_id
LEFT JOIN branches b ON b.id = w.branch_id
JOIN products p ON p.id = ws.product_id
LEFT JOIN (
  SELECT 
    company_id, 
    warehouse_id, 
    product_id, 
    balance_unit_cost,
    ROW_NUMBER() OVER (PARTITION BY company_id, warehouse_id, product_id ORDER BY movement_date DESC, created_at DESC) AS rn
  FROM stock_ledger
) sl ON sl.company_id = p.company_id AND sl.warehouse_id = ws.warehouse_id AND sl.product_id = ws.product_id AND sl.rn = 1;

-- Nueva vista: Valorización de inventario
CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT
  c.id AS company_id,
  c.legal_name AS company_name,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  b.name AS branch_name,
  COUNT(DISTINCT ws.product_id) AS product_count,
  SUM(ws.balance_qty) AS total_quantity,
  SUM(ws.balance_qty * COALESCE(sl.balance_unit_cost, 0)) AS total_value
FROM warehouse_stock ws
JOIN warehouses w ON w.id = ws.warehouse_id
LEFT JOIN branches b ON b.id = w.branch_id
JOIN companies c ON c.id = w.company_id
LEFT JOIN (
  SELECT 
    company_id, 
    warehouse_id, 
    product_id, 
    balance_unit_cost,
    ROW_NUMBER() OVER (PARTITION BY company_id, warehouse_id, product_id ORDER BY movement_date DESC, created_at DESC) AS rn
  FROM stock_ledger
) sl ON sl.company_id = c.id AND sl.warehouse_id = ws.warehouse_id AND sl.product_id = ws.product_id AND sl.rn = 1
GROUP BY c.id, c.legal_name, w.id, w.name, b.name;


-- ================ KARDEX - ENTRADAS ================
-- Procesar receptions/reception_items para stock_ledger
CREATE OR REPLACE FUNCTION process_reception_for_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_purchase_doc purchase_docs%ROWTYPE;
    v_reception receptions%ROWTYPE;
    v_unit_cost NUMERIC;
    v_total_cost NUMERIC;

    -- Inventario
    prev_qty numeric(18,6) := 0;
    prev_total numeric(18,6) := 0;
    prev_unit numeric(18,6) := 0;

    -- Balance
    balance_qty numeric(18,6) := 0;
    balance_total_cost numeric(18,6) := 0;
    balance_unit_cost numeric(18,6) := 0;

    count_purchase_doc INTEGER;

BEGIN
    -- Obtener la recepción
    SELECT * INTO v_reception
    FROM receptions
    WHERE id = NEW.reception_id;

    -- Obtener el documento de compra relacionado
    SELECT * INTO v_purchase_doc
    FROM purchase_docs
    WHERE id = v_reception.purchase_doc_id;



    IF v_purchase_doc.deleted_at IS NULL THEN
        v_unit_cost := v_purchase_doc.exchange_rate * NEW.unit_cost;
        v_total_cost := v_unit_cost * NEW.quantity_received;

        INSERT INTO stock_ledger (
            company_id,
            warehouse_id,
            product_id,
            movement_date,
            ref_doc_type,
            ref_doc_series,
            ref_doc_number,
            operation_type,
            qty_in, --cantidad recibida
            unit_cost_in,  -- costo unitario recibido
            total_cost_in,
            balance_qty,
            balance_unit_cost,
            balance_total_cost,

            original_currency_code,
            exchange_rate,
            original_unit_cost_in,
            original_total_cost_in,
            source,
            source_id,
            created_at
        )
        VALUES (
            v_purchase_doc.company_id,
            v_reception.warehouse_id,
            NEW.product_id,
            v_reception.reception_date,
            v_purchase_doc.doc_type,
            v_purchase_doc.series,
            v_purchase_doc.number,
            COALESCE(v_purchase_doc.op_type_kardex, '02'),
            NEW.quantity_received, -- cantidad recibida
            v_unit_cost,
            v_total_cost,

            balance_qty,
            balance_unit_cost,
            balance_total_cost,

            v_purchase_doc.currency_code,
            v_purchase_doc.exchange_rate,
            NEW.unit_cost,
            NEW.unit_cost * NEW.quantity_received,
            'receptions',
            v_reception.id,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_reception_for_ledger
AFTER INSERT ON reception_items
FOR EACH ROW
EXECUTE FUNCTION process_reception_for_ledger();

-- ================ KARDEX - SALIDAS ================
-- Procesar shipments/shipment_items para stock_ledger
CREATE OR REPLACE FUNCTION process_shipment_for_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_sales_doc sales_docs%ROWTYPE;
    v_shipment shipments%ROWTYPE;
    v_unit_cost NUMERIC;
BEGIN
    -- Obtener el shipment
    SELECT * INTO v_shipment
    FROM shipments
    WHERE id = NEW.shipment_id;

    -- Obtener documento de venta relacionado
    SELECT * INTO v_sales_doc
    FROM sales_docs
    WHERE id = v_shipment.sales_doc_id;

    IF v_sales_doc.deleted_at IS NULL THEN
        -- Obtener el costo promedio actual
        SELECT COALESCE(balance_unit_cost, 0) INTO v_unit_cost
        FROM stock_ledger
        WHERE product_id = NEW.product_id
        AND company_id = v_sales_doc.company_id
        AND warehouse_id = v_shipment.warehouse_id
        ORDER BY movement_date DESC, created_at DESC
        LIMIT 1;

        INSERT INTO stock_ledger (
            company_id,
            warehouse_id,
            product_id,
            movement_date,
            ref_doc_type,
            ref_doc_series,
            ref_doc_number,
            operation_type,
            qty_out,
            unit_cost_out,
            total_cost_out,
            source,
            source_id,
            created_at
        )
        VALUES (
            v_sales_doc.company_id,
            v_shipment.warehouse_id,
            NEW.product_id,
            v_shipment.shipment_date,
            v_sales_doc.doc_type,
            v_sales_doc.series,
            v_sales_doc.number,
            COALESCE(v_sales_doc.op_type_kardex, '01'),
            NEW.quantity_shipped,
            v_unit_cost,
            v_unit_cost * NEW.quantity_shipped,
            'shipments',
            v_shipment.id,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_shipment_for_ledger
AFTER INSERT ON shipment_items
FOR EACH ROW
EXECUTE FUNCTION process_shipment_for_ledger();

-- Actualizar Precios Historicos de Productos
CREATE OR REPLACE FUNCTION public.update_product_purchase_prices()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_purchase_doc public.purchase_docs%ROWTYPE;
BEGIN
    -- 1. Obtener los datos del documento de compra principal (la cabecera)
    SELECT * INTO v_purchase_doc
    FROM public.purchase_docs
    WHERE id = NEW.purchase_doc_id;

    -- 2. Asegurarnos de que el documento de compra existe y no está eliminado
    IF FOUND AND v_purchase_doc.deleted_at IS NULL THEN
        -- 3. Insertar el nuevo registro de precio de compra
        INSERT INTO public.product_purchase_prices (
            company_id,
            product_id,
            supplier_id,
            currency_code,
            unit_price, -- En esta tabla, unit_price se refiere al costo de compra
            observed_at,
            source_doc_type,
            source_doc_series,
            source_doc_number
        )
        VALUES (
            v_purchase_doc.company_id,
            NEW.product_id,
            v_purchase_doc.supplier_id,
            v_purchase_doc.currency_code,
            NEW.unit_cost, -- Usamos el unit_cost del item de compra
            v_purchase_doc.issue_date,
            v_purchase_doc.doc_type,
            v_purchase_doc.series,
            v_purchase_doc.number
        )
        -- 4. Si ya existe un registro idéntico (por alguna razón), no hacer nada
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NULL; -- El valor de retorno es ignorado en triggers AFTER
END;
$$;

-- Eliminar el trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS trg_after_insert_purchase_item_prices ON public.purchase_doc_items;

-- Crear el trigger
CREATE TRIGGER trg_after_insert_purchase_item_prices
AFTER INSERT ON public.purchase_doc_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_purchase_prices();

-- ================= product_price_history =================
-- registrar tanto precios de compra como de venta.
CREATE OR REPLACE FUNCTION public.update_product_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_price_type TEXT := TG_ARGV[0]; -- 'PURCHASE' o 'SALE'
    v_company_id UUID;
    v_source_doc_id UUID;
    v_issue_date DATE;
    v_currency_code VARCHAR(3);
    v_unit_price NUMERIC(18,6);
BEGIN
    -- 1. Determinar el origen (compra o venta) y obtener los datos necesarios
    IF v_price_type = 'PURCHASE' THEN
        SELECT c.id, pd.id, pd.issue_date, pd.currency_code, pdi.unit_cost
        INTO v_company_id, v_source_doc_id, v_issue_date, v_currency_code, v_unit_price
        FROM public.purchase_doc_items pdi
        JOIN public.purchase_docs pd ON pdi.purchase_doc_id = pd.id
        JOIN public.companies c ON pd.company_id = c.id
        WHERE pdi.id = NEW.id;

    ELSIF v_price_type = 'SALE' THEN
        SELECT c.id, sd.id, sd.issue_date, sd.currency_code, sdi.unit_price
        INTO v_company_id, v_source_doc_id, v_issue_date, v_currency_code, v_unit_price
        FROM public.sales_doc_items sdi
        JOIN public.sales_docs sd ON sdi.sales_doc_id = sd.id
        JOIN public.companies c ON sd.company_id = c.id
        WHERE sdi.id = NEW.id;
    ELSE
        -- Si el argumento es inválido, no hacer nada
        RETURN NULL;
    END IF;

    -- 2. "Cerrar" el precio anterior: buscar el precio activo (effective_to IS NULL)
    -- y establecer su fecha de fin al día anterior al nuevo precio.
    UPDATE public.product_price_history
    SET effective_to = v_issue_date - INTERVAL '1 day'
    WHERE company_id = v_company_id
      AND product_id = NEW.product_id
      AND price_type = v_price_type
      AND effective_to IS NULL;

    -- 3. Insertar el nuevo registro de historial de precio, dejándolo como el activo
    INSERT INTO public.product_price_history (
        company_id,
        product_id,
        price_type,
        unit_price,
        currency_code,
        effective_from,
        effective_to, -- Se deja en NULL para indicar que es el precio actual
        source_doc_id
    )
    VALUES (
        v_company_id,
        NEW.product_id,
        v_price_type,
        v_unit_price,
        v_currency_code,
        v_issue_date,
        NULL,
        v_source_doc_id
    );

    RETURN NULL;
END;
$$;

-- =========== Trigger para Compras ===========
-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS trg_after_insert_purchase_item_history ON public.purchase_doc_items;

-- Crear el trigger
CREATE TRIGGER trg_after_insert_purchase_item_history
AFTER INSERT ON public.purchase_doc_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_price_history('PURCHASE');

-- =========== Trigger para Ventas ===========
-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS trg_after_insert_sale_item_history ON public.sales_doc_items;

-- Crear el trigger
CREATE TRIGGER trg_after_insert_sale_item_history
AFTER INSERT ON public.sales_doc_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_price_history('SALE');


-- =========== Trigger para Costo de Ventas ===========

-- 1. Crear tabla para almacenar el reporte de costo de ventas
CREATE TABLE IF NOT EXISTS cost_of_sales_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period DATE NOT NULL, -- Primer día del mes (YYYY-MM-01)
    initial_quantity NUMERIC(18,6) DEFAULT 0,
    initial_total_cost NUMERIC(18,6) DEFAULT 0,
    entries_quantity NUMERIC(18,6) DEFAULT 0,
    entries_total_cost NUMERIC(18,6) DEFAULT 0,
    exits_quantity NUMERIC(18,6) DEFAULT 0,
    exits_total_cost NUMERIC(18,6) DEFAULT 0,
    final_quantity NUMERIC(18,6) DEFAULT 0,
    final_total_cost NUMERIC(18,6) DEFAULT 0,
    sales_quantity NUMERIC(18,6) DEFAULT 0,
    sales_total_amount NUMERIC(18,6) DEFAULT 0,
    cost_of_sales_total NUMERIC(18,6) DEFAULT 0,
    profit NUMERIC(18,6) DEFAULT 0,
    margin NUMERIC(5,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, product_id, period)
);

-- 2. Vista para el reporte en tiempo real
CREATE OR REPLACE VIEW v_cost_of_sales_report AS
WITH period_data AS (
    SELECT 
        DATE_TRUNC('month', movement_date)::DATE as period,
        company_id,
        product_id,
        -- Inventario inicial (último balance del mes anterior)
        COALESCE(LAG(balance_qty) OVER (PARTITION BY company_id, product_id ORDER BY movement_date), 0) as initial_qty,
        COALESCE(LAG(balance_total_cost) OVER (PARTITION BY company_id, product_id ORDER BY movement_date), 0) as initial_cost,
        -- Entradas y salidas del mes
        SUM(qty_in) OVER (PARTITION BY company_id, product_id, DATE_TRUNC('month', movement_date)) as entries_qty,
        SUM(total_cost_in) OVER (PARTITION BY company_id, product_id, DATE_TRUNC('month', movement_date)) as entries_cost,
        SUM(qty_out) OVER (PARTITION BY company_id, product_id, DATE_TRUNC('month', movement_date)) as exits_qty,
        SUM(total_cost_out) OVER (PARTITION BY company_id, product_id, DATE_TRUNC('month', movement_date)) as exits_cost,
        -- Saldo final
        balance_qty as final_qty,
        balance_total_cost as final_cost
    FROM stock_ledger
    WHERE deleted_at IS NULL
),
sales_data AS (
    SELECT
        DATE_TRUNC('month', s.issue_date)::DATE as period,
        s.company_id,
        si.product_id,
        SUM(si.quantity) as sales_qty,
        SUM(si.total_line) as sales_amount
    FROM sales_docs s
    JOIN sales_doc_items si ON s.id = si.sales_doc_id
    WHERE s.deleted_at IS NULL
    GROUP BY 1, 2, 3
)
SELECT
    pd.period,
    c.id as company_id,
    c.legal_name as company_name,
    p.id as product_id,
    p.sku,
    p.name as product_name,
    pd.initial_qty as initial_quantity,
    pd.initial_cost as initial_total_cost,
    pd.entries_qty as entries_quantity,
    pd.entries_cost as entries_total_cost,
    pd.exits_qty as exits_quantity,
    pd.exits_cost as exits_total_cost,
    pd.final_qty as final_quantity,
    pd.final_cost as final_total_cost,
    COALESCE(sd.sales_qty, 0) as sales_quantity,
    COALESCE(sd.sales_amount, 0) as sales_total_amount,
    pd.exits_cost as cost_of_sales_total,
    COALESCE(sd.sales_amount, 0) - pd.exits_cost as profit,
    CASE 
        WHEN COALESCE(sd.sales_amount, 0) > 0 
        THEN ((COALESCE(sd.sales_amount, 0) - pd.exits_cost) / sd.sales_amount) * 100 
        ELSE 0 
    END as margin
FROM period_data pd
JOIN companies c ON c.id = pd.company_id
JOIN products p ON p.id = pd.product_id
LEFT JOIN sales_data sd ON sd.period = pd.period 
    AND sd.company_id = pd.company_id 
    AND sd.product_id = pd.product_id;

-- 3. Función auxiliar para actualizar un registro específico
CREATE OR REPLACE FUNCTION update_single_cost_report(
    p_company_id UUID,
    p_product_id UUID,
    p_period DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO cost_of_sales_report (
        company_id, product_id, period,
        initial_quantity, initial_total_cost,
        entries_quantity, entries_total_cost,
        exits_quantity, exits_total_cost,
        final_quantity, final_total_cost,
        sales_quantity, sales_total_amount,
        cost_of_sales_total, profit, margin
    )
    SELECT
        company_id, product_id, period,
        initial_quantity, initial_total_cost,
        entries_quantity, entries_total_cost,
        exits_quantity, exits_total_cost,
        final_quantity, final_total_cost,
        sales_quantity, sales_total_amount,
        cost_of_sales_total, profit, margin
    FROM v_cost_of_sales_report
    WHERE company_id = p_company_id
        AND product_id = p_product_id
        AND period = p_period
    ON CONFLICT (company_id, product_id, period)
    DO UPDATE SET
        initial_quantity = EXCLUDED.initial_quantity,
        initial_total_cost = EXCLUDED.initial_total_cost,
        entries_quantity = EXCLUDED.entries_quantity,
        entries_total_cost = EXCLUDED.entries_total_cost,
        exits_quantity = EXCLUDED.exits_quantity,
        exits_total_cost = EXCLUDED.exits_total_cost,
        final_quantity = EXCLUDED.final_quantity,
        final_total_cost = EXCLUDED.final_total_cost,
        sales_quantity = EXCLUDED.sales_quantity,
        sales_total_amount = EXCLUDED.sales_total_amount,
        cost_of_sales_total = EXCLUDED.cost_of_sales_total,
        profit = EXCLUDED.profit,
        margin = EXCLUDED.margin,
        updated_at = NOW();
END;
$$;

-- 4. Función principal para actualizar el reporte
CREATE OR REPLACE FUNCTION update_cost_of_sales_report()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_company_id UUID;
    v_product_id UUID;
    v_period DATE;
BEGIN
    -- Determinar los valores según la tabla y operación
    IF TG_TABLE_NAME = 'stock_ledger' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_company_id := NEW.company_id;
            v_product_id := NEW.product_id;
            v_period := DATE_TRUNC('month', NEW.movement_date)::DATE;
        ELSIF TG_OP = 'DELETE' THEN
            v_company_id := OLD.company_id;
            v_product_id := OLD.product_id;
            v_period := DATE_TRUNC('month', OLD.movement_date)::DATE;
        END IF;
    ELSIF TG_TABLE_NAME = 'sales_docs' THEN
        -- Para sales_docs, necesitamos obtener los productos afectados
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_company_id := NEW.company_id;
            v_period := DATE_TRUNC('month', NEW.issue_date)::DATE;
            
            -- Actualizar todos los productos de este documento de venta
            FOR v_product_id IN 
                SELECT DISTINCT product_id 
                FROM sales_doc_items 
                WHERE sales_doc_id = NEW.id
            LOOP
                PERFORM update_single_cost_report(v_company_id, v_product_id, v_period);
            END LOOP;
            RETURN NULL;
        ELSIF TG_OP = 'DELETE' THEN
            v_company_id := OLD.company_id;
            v_period := DATE_TRUNC('month', OLD.issue_date)::DATE;
            
            -- Actualizar todos los productos de este documento de venta
            FOR v_product_id IN 
                SELECT DISTINCT product_id 
                FROM sales_doc_items 
                WHERE sales_doc_id = OLD.id
            LOOP
                PERFORM update_single_cost_report(v_company_id, v_product_id, v_period);
            END LOOP;
            RETURN NULL;
        END IF;
    ELSIF TG_TABLE_NAME = 'sales_doc_items' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            SELECT company_id, DATE_TRUNC('month', issue_date)::DATE 
            INTO v_company_id, v_period
            FROM sales_docs WHERE id = NEW.sales_doc_id;
            
            v_product_id := NEW.product_id;
        ELSIF TG_OP = 'DELETE' THEN
            SELECT company_id, DATE_TRUNC('month', issue_date)::DATE 
            INTO v_company_id, v_period
            FROM sales_docs WHERE id = OLD.sales_doc_id;
            
            v_product_id := OLD.product_id;
        END IF;
    END IF;

    -- Actualizar el reporte para el producto y periodo específicos
    PERFORM update_single_cost_report(v_company_id, v_product_id, v_period);
    
    RETURN NULL;
END;
$$;

-- 5. Crear los triggers
DROP TRIGGER IF EXISTS trigger_update_cost_report_stock ON stock_ledger;
DROP TRIGGER IF EXISTS trigger_update_cost_report_sales ON sales_docs;
DROP TRIGGER IF EXISTS trigger_update_cost_report_sales_items ON sales_doc_items;

CREATE TRIGGER trigger_update_cost_report_stock
    AFTER INSERT OR UPDATE OR DELETE ON stock_ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_of_sales_report();

CREATE TRIGGER trigger_update_cost_report_sales
    AFTER INSERT OR UPDATE OR DELETE ON sales_docs
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_of_sales_report();

CREATE TRIGGER trigger_update_cost_report_sales_items
    AFTER INSERT OR UPDATE OR DELETE ON sales_doc_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cost_of_sales_report();


-- ===================== PRODUCTS =====================
CREATE OR REPLACE FUNCTION list_products_full(
    p_company_id UUID,
    p_price_list_id UUID DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    sku TEXT,
    barcode TEXT,
    product_name TEXT,
    description TEXT,
    brand_name TEXT,
    category_name TEXT,
    unit_code TEXT,
    main_image TEXT,
    location TEXT,
    unit_price NUMERIC,
    currency_code VARCHAR(3),
    discount_value NUMERIC,
    metadata JSONB
)
LANGUAGE sql
AS $$
    SELECT 
        p.id AS product_id,
        p.sku,
        p.barcode,
        p.name AS product_name,
        p.description,
        b.name AS brand_name,
        c.name AS category_name,
        p.unit_code,
        -- Imagen principal
        (SELECT pi.storage_path 
         FROM product_images pi 
         WHERE pi.product_id = p.id 
           AND pi.is_primary = true 
         LIMIT 1) AS main_image,
        -- Ubicación principal en almacén
        (SELECT CONCAT(wz.code, ' / ', wl.position_x, ',', wl.position_y, ',', wl.position_z)
         FROM product_location wl
         JOIN warehouse_zones wz ON wz.id = wl.warehouse_zone_id
         WHERE wl.product_id = p.id 
           AND wl.es_principal = true
         LIMIT 1) AS location,
        -- Precio: si pasa price_list_id, usarlo. Si no, precio de venta más reciente.
        COALESCE(
            (SELECT pli.unit_price
             FROM price_list_items pli
             WHERE pli.product_id = p.id 
               AND pli.price_list_id = p_price_list_id
             ORDER BY pli.valid_from DESC
             LIMIT 1),
            (SELECT ph.unit_price
             FROM product_price_history ph
             WHERE ph.product_id = p.id
               AND ph.price_type = 'SALE'
             ORDER BY ph.effective_from DESC
             LIMIT 1)
        ) AS unit_price,
        COALESCE(
            (SELECT pl.currency_code
             FROM price_lists pl
             WHERE pl.id = p_price_list_id
             LIMIT 1),
            (SELECT ph.currency_code
             FROM product_price_history ph
             WHERE ph.product_id = p.id
               AND ph.price_type = 'SALE'
             ORDER BY ph.effective_from DESC
             LIMIT 1)
        ) AS currency_code,
        -- Descuento si aplica
        (SELECT d.value
         FROM discounts d
         JOIN discount_products dp ON dp.discount_id = d.id
         WHERE dp.product_id = p.id
           AND d.is_active = true
           AND CURRENT_DATE BETWEEN d.valid_from AND COALESCE(d.valid_to, CURRENT_DATE)
         LIMIT 1) AS discount_value,
        p.metadata
    FROM products p
    JOIN brands b ON b.id = p.brand_id
    JOIN categories c ON c.id = p.category_id
    WHERE p.company_id = p_company_id
      AND p.active = true;
$$;
