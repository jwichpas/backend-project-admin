-- ============================================================================
-- SISTEMA ERP - GUÍAS DE REMISIÓN MULTIEMPRESA
-- ============================================================================
-- Autor: Claude Code
-- Fecha: 25/09/2025
-- Migración para manejar guías de remisión con soporte multiempresa y relación
-- con documentos de venta y compra

-- ============================================================================
-- TABLA PRINCIPAL: GUÍAS DE REMISIÓN
-- ============================================================================

CREATE TABLE IF NOT EXISTS despatch_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias multiempresa
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Numeración del documento
    series VARCHAR(10) NOT NULL,
    correlativo VARCHAR(10) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    doc_type VARCHAR(2) NOT NULL DEFAULT '09', -- Catálogo 01: Guía de Remisión
    version VARCHAR(10) DEFAULT '2022',

    -- Destinatario
    recipient_doc_type VARCHAR(1) NOT NULL REFERENCES sunat.cat_06_doc_identidad(code),
    recipient_doc_number VARCHAR(15) NOT NULL,
    recipient_business_name TEXT NOT NULL,

    -- Información del traslado
    transfer_reason VARCHAR(2) NOT NULL REFERENCES sunat.cat_20_motivo_traslado(code), -- Catálogo 20: Motivo de traslado
    transport_mode VARCHAR(2) NOT NULL REFERENCES sunat.cat_18_modalidad_traslado(code), -- Catálogo 18: Modalidad de transporte
    transfer_date DATE NOT NULL,
    total_weight NUMERIC(18,3) NOT NULL,
    weight_unit VARCHAR(10) DEFAULT 'KGM',
    number_packages INTEGER,

    -- Direcciones de traslado
    origin_ubigeo VARCHAR(6) NOT NULL REFERENCES sunat.ubigeo(code),
    origin_address TEXT NOT NULL,
    destination_ubigeo VARCHAR(6) NOT NULL REFERENCES sunat.ubigeo(code),
    destination_address TEXT NOT NULL,

    -- Transportista (para transporte público - modalidad 01)
    carrier_doc_type VARCHAR(1) REFERENCES sunat.cat_06_doc_identidad(code),
    carrier_doc_number VARCHAR(15),
    carrier_business_name TEXT,
    carrier_mtc_number VARCHAR(10),

    -- Vehículo principal (para transporte privado - modalidad 02)
    vehicle_plate VARCHAR(10),

    -- Conductor principal (para transporte privado)
    driver_doc_type VARCHAR(1) REFERENCES sunat.cat_06_doc_identidad(code),
    driver_doc_number VARCHAR(15),
    driver_first_names TEXT,
    driver_last_names TEXT,
    driver_license VARCHAR(15),

    -- Estado SUNAT y respuestas
    ticket VARCHAR(100), -- Ticket de envío a SUNAT
    xml_content TEXT, -- XML generado
    cdr_zip_content TEXT, -- CDR (Comprobante de Recepción) en base64
    sunat_response JSONB, -- Respuesta completa de SUNAT
    sent_to_sunat BOOLEAN DEFAULT FALSE,
    sunat_status TEXT DEFAULT 'PENDING' CHECK (sunat_status IN ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED')),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(series, correlativo, company_id)
);

-- ============================================================================
-- TABLA DE DETALLES: PRODUCTOS/SERVICIOS EN LA GUÍA
-- ============================================================================

CREATE TABLE IF NOT EXISTS despatch_guide_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despatch_guide_id UUID NOT NULL REFERENCES despatch_guides(id) ON DELETE CASCADE,

    -- Información del producto/servicio
    product_code VARCHAR(50) NOT NULL, -- Código interno del producto
    description TEXT NOT NULL,
    unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
    quantity NUMERIC(18,3) NOT NULL,

    -- Campos opcionales adicionales
    sunat_product_code VARCHAR(20), -- Código SUNAT del producto (si aplica)
    unit_weight NUMERIC(18,3), -- Peso unitario
    observations TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices
    CONSTRAINT fk_despatch_guide_details_guide FOREIGN KEY (despatch_guide_id) REFERENCES despatch_guides(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLAS DE RELACIÓN: GUÍAS CON DOCUMENTOS DE ORIGEN
-- ============================================================================

-- Relación con documentos de venta
CREATE TABLE IF NOT EXISTS despatch_guide_sales_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despatch_guide_id UUID NOT NULL REFERENCES despatch_guides(id) ON DELETE CASCADE,
    sales_doc_id UUID NOT NULL REFERENCES sales_docs(id) ON DELETE RESTRICT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar duplicados
    UNIQUE(despatch_guide_id, sales_doc_id)
);

-- Relación con documentos de compra
CREATE TABLE IF NOT EXISTS despatch_guide_purchase_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despatch_guide_id UUID NOT NULL REFERENCES despatch_guides(id) ON DELETE CASCADE,
    purchase_doc_id UUID NOT NULL REFERENCES purchase_docs(id) ON DELETE RESTRICT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar duplicados
    UNIQUE(despatch_guide_id, purchase_doc_id)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_despatch_guides_company_branch ON despatch_guides(company_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_despatch_guides_issue_date ON despatch_guides(issue_date);
CREATE INDEX IF NOT EXISTS idx_despatch_guides_transfer_date ON despatch_guides(transfer_date);
CREATE INDEX IF NOT EXISTS idx_despatch_guides_sunat_status ON despatch_guides(sunat_status);
CREATE INDEX IF NOT EXISTS idx_despatch_guides_ticket ON despatch_guides(ticket) WHERE ticket IS NOT NULL;

-- Índices para detalles
CREATE INDEX IF NOT EXISTS idx_despatch_guide_details_guide_id ON despatch_guide_details(despatch_guide_id);
CREATE INDEX IF NOT EXISTS idx_despatch_guide_details_product_code ON despatch_guide_details(product_code);

-- Índices para relaciones
CREATE INDEX IF NOT EXISTS idx_despatch_guide_sales_docs_guide ON despatch_guide_sales_docs(despatch_guide_id);
CREATE INDEX IF NOT EXISTS idx_despatch_guide_sales_docs_sales ON despatch_guide_sales_docs(sales_doc_id);
CREATE INDEX IF NOT EXISTS idx_despatch_guide_purchase_docs_guide ON despatch_guide_purchase_docs(despatch_guide_id);
CREATE INDEX IF NOT EXISTS idx_despatch_guide_purchase_docs_purchase ON despatch_guide_purchase_docs(purchase_doc_id);

-- ============================================================================
-- TRIGGERS PARA AUDITORÍA
-- ============================================================================

-- Trigger para updated_at en guías de remisión
CREATE TRIGGER set_timestamp_despatch_guides
    BEFORE UPDATE ON despatch_guides
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Habilitar RLS en las tablas
ALTER TABLE despatch_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE despatch_guide_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE despatch_guide_sales_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE despatch_guide_purchase_docs ENABLE ROW LEVEL SECURITY;

-- Política para guías de remisión: usuarios solo ven las de sus empresas
CREATE POLICY "Users can view despatch guides from their companies" ON despatch_guides
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_companies
            WHERE user_id = auth.uid()
        )
    );

-- Política para detalles: a través de la guía
CREATE POLICY "Users can view despatch guide details through guides" ON despatch_guide_details
    FOR ALL USING (
        despatch_guide_id IN (
            SELECT id FROM despatch_guides
            WHERE company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Política para relaciones con ventas: a través de la guía
CREATE POLICY "Users can view despatch guide sales relations through guides" ON despatch_guide_sales_docs
    FOR ALL USING (
        despatch_guide_id IN (
            SELECT id FROM despatch_guides
            WHERE company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Política para relaciones con compras: a través de la guía
CREATE POLICY "Users can view despatch guide purchase relations through guides" ON despatch_guide_purchase_docs
    FOR ALL USING (
        despatch_guide_id IN (
            SELECT id FROM despatch_guides
            WHERE company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE despatch_guides IS 'Guías de remisión electrónicas con soporte multiempresa';
COMMENT ON TABLE despatch_guide_details IS 'Detalles de productos/servicios en las guías de remisión';
COMMENT ON TABLE despatch_guide_sales_docs IS 'Relación entre guías de remisión y documentos de venta';
COMMENT ON TABLE despatch_guide_purchase_docs IS 'Relación entre guías de remisión y documentos de compra';

COMMENT ON COLUMN despatch_guides.transfer_reason IS 'Catálogo 20 SUNAT: Motivo de traslado (01=Venta, 02=Compra, etc.)';
COMMENT ON COLUMN despatch_guides.transport_mode IS 'Catálogo 18 SUNAT: Modalidad de transporte (01=Público, 02=Privado)';
COMMENT ON COLUMN despatch_guides.sunat_status IS 'Estado en SUNAT: PENDING, SENT, ACCEPTED, REJECTED';
COMMENT ON COLUMN despatch_guides.ticket IS 'Ticket devuelto por SUNAT para consultar estado';