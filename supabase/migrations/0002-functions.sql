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
