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
-- PASO 15: FUNCIONES OPTIMIZADAS PARA CÁLCULO DE INVENTARIO (FUSIONADO)
-- ============================================================================

-- calcular los balances de la nueva fila en el momento de insertarla.
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

  -- Obtener el último balance válido (excluyendo registros eliminados)
  SELECT COALESCE(balance_qty, 0), COALESCE(balance_total_cost, 0), COALESCE(balance_unit_cost, 0)
  INTO prev_qty, prev_total, prev_unit
  FROM stock_ledger
  WHERE company_id = NEW.company_id
    AND warehouse_id = NEW.warehouse_id
    AND product_id = NEW.product_id
    AND deleted_at IS NULL
    AND (movement_date < NEW.movement_date 
         OR (movement_date = NEW.movement_date AND created_at < NEW.created_at))
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

  -- Calcular nuevos balances según el método de valuación
  IF valuation_method = 'PROMEDIO_MOVIL' THEN
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
  ELSIF valuation_method = 'FIFO' THEN
    NEW.balance_qty := prev_qty + COALESCE(NEW.qty_in, 0) - COALESCE(NEW.qty_out, 0);
    NEW.balance_total_cost := prev_total + COALESCE(NEW.total_cost_in, 0) - COALESCE(NEW.total_cost_out, 0);
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

CREATE OR REPLACE FUNCTION recompute_stock_ledger_balances(
    p_company_id UUID,
    p_warehouse_id UUID,
    p_product_id UUID,
    p_start_date DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    prev_qty numeric(18,6) := 0;
    prev_total numeric(18,6) := 0;
    prev_unit numeric(18,6) := 0;
    valuation_method text;
BEGIN
    -- Obtener método de valuación
    SELECT c.valuation_method INTO valuation_method
    FROM companies c
    WHERE c.id = p_company_id;

    -- Encontrar el balance previo justo antes de p_start_date
    SELECT COALESCE(balance_qty, 0), COALESCE(balance_total_cost, 0), COALESCE(balance_unit_cost, 0)
    INTO prev_qty, prev_total, prev_unit
    FROM stock_ledger
    WHERE company_id = p_company_id
      AND warehouse_id = p_warehouse_id
      AND product_id = p_product_id
      AND movement_date < p_start_date
      AND deleted_at IS NULL
    ORDER BY movement_date DESC, created_at DESC
    LIMIT 1;

    -- Loop sobre movimientos a partir de p_start_date, en orden
    FOR r IN
        SELECT *
        FROM stock_ledger
        WHERE company_id = p_company_id
          AND warehouse_id = p_warehouse_id
          AND product_id = p_product_id
          AND movement_date >= p_start_date
          AND deleted_at IS NULL
        ORDER BY movement_date ASC, created_at ASC
    LOOP
        -- Recalcular costos si es necesario
        IF r.qty_in > 0 AND r.total_cost_in IS NULL THEN
            r.total_cost_in := r.qty_in * COALESCE(r.unit_cost_in, 0);
        END IF;
        IF r.qty_out > 0 AND r.total_cost_out IS NULL THEN
            r.unit_cost_out := prev_unit;
            r.total_cost_out := r.qty_out * r.unit_cost_out;
        END IF;

        -- Recalcular balances según método
        IF valuation_method = 'PROMEDIO_MOVIL' THEN
            IF r.qty_in > 0 THEN
                r.balance_qty := prev_qty + r.qty_in;
                r.balance_total_cost := prev_total + r.total_cost_in;
                r.balance_unit_cost := CASE WHEN r.balance_qty > 0 THEN r.balance_total_cost / r.balance_qty ELSE 0 END;
            ELSIF r.qty_out > 0 THEN
                r.balance_qty := GREATEST(prev_qty - r.qty_out, 0);
                r.balance_total_cost := GREATEST(prev_total - r.total_cost_out, 0);
                r.balance_unit_cost := CASE WHEN r.balance_qty > 0 THEN r.balance_total_cost / r.balance_qty ELSE 0 END;
            ELSE
                r.balance_qty := prev_qty;
                r.balance_total_cost := prev_total;
                r.balance_unit_cost := prev_unit;
            END IF;
        ELSIF valuation_method = 'FIFO' THEN
            r.balance_qty := GREATEST(prev_qty + r.qty_in - r.qty_out, 0);
            r.balance_total_cost := GREATEST(prev_total + r.total_cost_in - r.total_cost_out, 0);
            r.balance_unit_cost := CASE WHEN r.balance_qty > 0 THEN r.balance_total_cost / r.balance_qty ELSE 0 END;
        END IF;

        r.balance_qty := COALESCE(r.balance_qty, 0);
        r.balance_total_cost := COALESCE(r.balance_total_cost, 0);
        r.balance_unit_cost := COALESCE(r.balance_unit_cost, 0);

        -- Actualizar el row con los nuevos valores
        UPDATE stock_ledger
        SET
            balance_qty = r.balance_qty,
            balance_unit_cost = r.balance_unit_cost,
            balance_total_cost = r.balance_total_cost,
            unit_cost_in = r.unit_cost_in,
            total_cost_in = r.total_cost_in,
            unit_cost_out = r.unit_cost_out,
            total_cost_out = r.total_cost_out
        WHERE id = r.id AND movement_date = r.movement_date;

        -- Actualizar prev para el siguiente row
        prev_qty := r.balance_qty;
        prev_total := r.balance_total_cost;
        prev_unit := r.balance_unit_cost;
    END LOOP;
END;
$$;

-- Función del trigger para AFTER UPDATE
CREATE OR REPLACE FUNCTION trigger_recompute_stock_ledger_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Recalcular a partir de la fecha del movimiento actualizado
    PERFORM recompute_stock_ledger_balances(NEW.company_id, NEW.warehouse_id, NEW.product_id, NEW.movement_date);
    -- También sincronizar warehouse_stock (por si cambia balance final)
    PERFORM sync_warehouse_stock(NEW.company_id, NEW.warehouse_id, NEW.product_id);
    RETURN NULL;
END;
$$;

-- Crear el trigger AFTER UPDATE (solo si cambian columnas clave)
DROP TRIGGER IF EXISTS after_stock_ledger_update ON stock_ledger;
CREATE TRIGGER after_stock_ledger_update
AFTER UPDATE ON stock_ledger
FOR EACH ROW
WHEN (
    OLD.qty_in IS DISTINCT FROM NEW.qty_in OR
    OLD.qty_out IS DISTINCT FROM NEW.qty_out OR
    OLD.total_cost_in IS DISTINCT FROM NEW.total_cost_in OR
    OLD.total_cost_out IS DISTINCT FROM NEW.total_cost_out OR
    OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
)
EXECUTE FUNCTION trigger_recompute_stock_ledger_balances();


-- ======================= INICIO::ACTUALIZA STOCK EN ALMACENES =====================================
-- Actualizar el stock en warehouse_stock después de un movimiento en stock_ledger
-- Mantener stock de un producto en un almacén (insert/update automático)
CREATE OR REPLACE FUNCTION update_warehouse_stock_balance(
    p_warehouse_id UUID,
    p_product_id UUID,
    p_balance_qty NUMERIC
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO warehouse_stock (warehouse_id, product_id, balance_qty)
    VALUES (p_warehouse_id, p_product_id, p_balance_qty)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET balance_qty = EXCLUDED.balance_qty;
END;
$$;

-- Calcular el stock real desde el ledger y sincronizar en warehouse_stock
CREATE OR REPLACE FUNCTION sync_warehouse_stock(
    p_company uuid,
    p_warehouse uuid,
    p_product uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_qty numeric(18,6);
BEGIN
    SELECT COALESCE(SUM(qty_in - qty_out),0)
    INTO v_qty
    FROM stock_ledger
    WHERE company_id = p_company
      AND warehouse_id = p_warehouse
      AND product_id = p_product
      AND deleted_at IS NULL;

    -- Usar la función base para actualizar
    PERFORM update_warehouse_stock_balance(p_warehouse, p_product, v_qty);
END;
$$;

-- Trigger que asegura sincronización en cada cambio del ledger
CREATE OR REPLACE FUNCTION trigger_sync_warehouse_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM sync_warehouse_stock(NEW.company_id, NEW.warehouse_id, NEW.product_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM sync_warehouse_stock(OLD.company_id, OLD.warehouse_id, OLD.product_id);
    END IF;
    RETURN NULL; -- AFTER triggers no necesitan devolver la fila
END;
$$;

-- Crear el trigger (solo una vez)
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
            COALESCE(v_sales_doc.op_type_kardex, '02'),
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

