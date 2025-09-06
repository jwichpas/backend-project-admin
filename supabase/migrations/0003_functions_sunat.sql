-- FUNCIONES DE ACCESO A CATÁLOGOS SUNAT
-- ==================================================

-- 1. Tipo de Documento (cat_01_tipo_documento)
CREATE OR REPLACE FUNCTION get_sunat_document_types()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT td.code, td.descripcion
    FROM sunat.cat_01_tipo_documento td
    ORDER BY td.code;
END;
$$;

-- 2. Monedas (cat_02_monedas)
CREATE OR REPLACE FUNCTION get_sunat_currencies()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT m.code, m.descripcion
    FROM sunat.cat_02_monedas m
    ORDER BY m.descripcion;
END;
$$;

-- 3. Unidades de Medida (cat_03_unidades_medida)
CREATE OR REPLACE FUNCTION get_sunat_measurement_units()
RETURNS TABLE (
    code VARCHAR(10),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT um.code, um.descripcion
    FROM sunat.cat_03_unidades_medida um
    ORDER BY um.descripcion;
END;
$$;

-- 4. Tipos de Tributo (cat_05_tipos_tributo)
CREATE OR REPLACE FUNCTION get_sunat_tax_types()
RETURNS TABLE (
    code VARCHAR(4),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT tt.code, tt.descripcion
    FROM sunat.cat_05_tipos_tributo tt
    ORDER BY tt.code;
END;
$$;

-- 5. Afectación IGV (cat_07_afect_igv)
CREATE OR REPLACE FUNCTION get_sunat_igv_affectations()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT ai.code, ai.descripcion
    FROM sunat.cat_07_afect_igv ai
    ORDER BY ai.code;
END;
$$;

-- 6. Documento de Identidad (cat_06_doc_identidad)
CREATE OR REPLACE FUNCTION get_sunat_identity_document_types()
RETURNS TABLE (
    code VARCHAR(1),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT dt.code, dt.descripcion
    FROM sunat.cat_06_doc_identidad dt
    ORDER BY dt.code;
END;
$$;

-- 7. Tipo de Operación (cat_12_tipo_operacion)
CREATE OR REPLACE FUNCTION get_sunat_operation_types()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT ot.code, ot.descripcion
    FROM sunat.cat_12_tipo_operacion ot
    ORDER BY ot.code;
END;
$$;

-- 8. Tipo de Precio Unitario (cat_16_tipo_precio_unitario)
CREATE OR REPLACE FUNCTION get_sunat_unit_price_types()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT upt.code, upt.descripcion
    FROM sunat.cat_16_tipo_precio_unitario upt
    ORDER BY upt.code;
END;
$$;

-- 9. Tipo de Operación (cat_17_tipo_operacion)
CREATE OR REPLACE FUNCTION get_sunat_operation_types_v2()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT ot.code, ot.descripcion
    FROM sunat.cat_17_tipo_operacion ot
    ORDER BY ot.code;
END;
$$;

-- 10. Modalidad de Traslado (cat_18_modalidad_traslado)
CREATE OR REPLACE FUNCTION get_sunat_transfer_modalities()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT tm.code, tm.descripcion
    FROM sunat.cat_18_modalidad_traslado tm
    ORDER BY tm.code;
END;
$$;

-- 11. Motivo de Traslado (cat_20_motivo_traslado)
CREATE OR REPLACE FUNCTION get_sunat_transfer_reasons()
RETURNS TABLE (
    code VARCHAR(2),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT tr.code, tr.descripcion
    FROM sunat.cat_20_motivo_traslado tr
    ORDER BY tr.code;
END;
$$;

-- 12. Tipo de Factura (cat_51_tipo_factura)
CREATE OR REPLACE FUNCTION get_sunat_invoice_types()
RETURNS TABLE (
    code VARCHAR(4),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT it.code, it.descripcion
    FROM sunat.cat_51_tipo_factura it
    ORDER BY it.code;
END;
$$;

-- 13. Código de Leyendas (cat_52_codigo_leyendas)
CREATE OR REPLACE FUNCTION get_sunat_legend_codes()
RETURNS TABLE (
    code VARCHAR(4),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT lc.code, lc.descripcion
    FROM sunat.cat_52_codigo_leyendas lc
    ORDER BY lc.code;
END;
$$;

-- 14. Código de Bienes y Servicios (cat_54_codigo_bb_ss)
CREATE OR REPLACE FUNCTION get_sunat_goods_services_codes()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT gsc.code, gsc.descripcion
    FROM sunat.cat_54_codigo_bb_ss gsc
    ORDER BY gsc.code;
END;
$$;

-- 15. Ubigeo
CREATE OR REPLACE FUNCTION get_sunat_ubigeo(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
    code VARCHAR(6),
    departamento TEXT,
    provincia TEXT,
    distrito TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.code,
        u.departamento,
        u.provincia,
        u.distrito,
        CONCAT(u.departamento, ' - ', u.provincia, ' - ', u.distrito) as full_name
    FROM sunat.ubigeo u
    WHERE search_term IS NULL 
       OR u.departamento ILIKE '%' || search_term || '%'
       OR u.provincia ILIKE '%' || search_term || '%'
       OR u.distrito ILIKE '%' || search_term || '%'
    ORDER BY u.departamento, u.provincia, u.distrito
    LIMIT 100;
END;
$$;

-- 16. Medios de Pago (tab_01_medio_pago)
CREATE OR REPLACE FUNCTION get_sunat_payment_methods()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT pm.code, pm.descripcion
    FROM sunat.tab_01_medio_pago pm
    ORDER BY pm.code;
END;
$$;

-- 17. Entidades Financieras (tab_03_entidad_financiera)
CREATE OR REPLACE FUNCTION get_sunat_financial_entities()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT fe.code, fe.descripcion
    FROM sunat.tab_03_entidad_financiera fe
    ORDER BY fe.code;
END;
$$;

-- 18. Tipo de Existencia (tab_05_tipo_existencia)
CREATE OR REPLACE FUNCTION get_sunat_existence_types()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT et.code, et.descripcion
    FROM sunat.tab_05_tipo_existencia et
    ORDER BY et.code;
END;
$$;

-- 19. Aduana (tab_11_aduana)
CREATE OR REPLACE FUNCTION get_sunat_customs()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT c.code, c.descripcion
    FROM sunat.tab_11_aduana c
    ORDER BY c.code;
END;
$$;

-- 20. Tipo de Operación (tab_12_tipo_operacion)
CREATE OR REPLACE FUNCTION get_sunat_operation_types_v3()
RETURNS TABLE (
    code VARCHAR(3),
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT ot.code, ot.descripcion
    FROM sunat.tab_12_tipo_operacion ot
    ORDER BY ot.code;
END;
$$;

-- FUNCIÓN UNIVERSAL PARA BUSCAR EN CUALQUIER CATÁLOGO
-- ==================================================
CREATE OR REPLACE FUNCTION search_sunat_catalog(
    catalog_name TEXT,
    search_field TEXT DEFAULT 'descripcion',
    search_value TEXT DEFAULT NULL,
    limit_results INT DEFAULT 100
)
RETURNS TABLE (
    code TEXT,
    descripcion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT code, descripcion FROM sunat.%I WHERE %I ILIKE %L ORDER BY code LIMIT %L',
        catalog_name,
        search_field,
        '%' || search_value || '%',
        limit_results
    );
END;
$$;

-- FUNCIÓN PARA OBTENER DESCRIPCIÓN ESPECÍFICA DE UN CÓDIGO
-- ========================================================
CREATE OR REPLACE FUNCTION get_sunat_code_description(
    catalog_name TEXT,
    code_value TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    description TEXT;
BEGIN
    EXECUTE format(
        'SELECT descripcion FROM sunat.%I WHERE code = %L',
        catalog_name,
        code_value
    ) INTO description;
    
    RETURN description;
END;
$$;