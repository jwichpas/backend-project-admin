-- ============================================================================
-- SISTEMA ERP - SCHEMA OPTIMIZADO PARA POSTGRESQL 15+
-- ============================================================================
-- Autor: Jhoel Ichpas
-- Fecha: 23/08/2025
-- PostgreSQL Version: 15+

-- PASO 1: EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ============================================================================

-- Habilitar extensiones críticas (fusionadas de ambas versiones)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Búsquedas textuales fuzzy
CREATE EXTENSION IF NOT EXISTS "btree_gin";     -- Índices compuestos optimizados
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- Rangos y overlaps
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS "bloom";         -- Filtros bloom para lookups

-- FUNCIÓN UNIVERSAL PARA TIMESTAMPS (versión optimizada)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

-- PASO 2: ESQUEMAS Y DOMINIOS CUSTOMIZADOS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sunat;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS partitions;

-- Dominios para consistencia de datos
CREATE DOMAIN monetary AS NUMERIC(18,6) CHECK (VALUE >= 0);
CREATE DOMAIN percentage AS NUMERIC(5,4) CHECK (VALUE >= 0 AND VALUE <= 100);
CREATE DOMAIN quantity AS NUMERIC(18,6) CHECK (VALUE >= 0);
CREATE DOMAIN ruc_pe AS VARCHAR(11) CHECK (VALUE ~ '^\\d{11}$');
CREATE DOMAIN email_address AS TEXT CHECK (VALUE ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$');

-- PASO 3: TABLAS DE CATÁLOGOS SUNAT
-- ============================================================================
-- FACTURACIÓN ELECTRÓNICA Y COMPROBANTES
CREATE TABLE IF NOT EXISTS sunat.cat_01_tipo_documento (
  code varchar(2) primary key,
  descripcion text not null
);

create table if not exists sunat.cat_02_monedas (
  code varchar(3) primary key, -- 'PEN','USD', etc.
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_03_unidades_medida (
  code varchar(10) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_05_tipos_tributo (
  code varchar(4) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_07_afect_igv (
  code varchar(2) primary key,
  descripcion text not null
);

create table if not exists sunat.cat_06_doc_identidad (
  code varchar(1) primary key, -- '1','6','7','A','B', etc.
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_12_tipo_operacion (
  code varchar(2) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_16_tipo_precio_unitario (
  code varchar(2) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_17_tipo_operacion (
  code varchar(4) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_18_modalidad_traslado (
  code varchar(2) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_20_motivo_traslado (
  code varchar(2) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_51_tipo_factura (
  code varchar(4) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_52_codigo_leyendas (
  code varchar(4) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_54_codigo_bb_ss (
  code varchar(3) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.ubigeo (
  code varchar(6) primary key,
  departamento text,
  provincia text,
  distrito text
);

-- FINANZAS - BANCOS Y MEDIOS DE PAGO

CREATE TABLE IF NOT EXISTS sunat.tab_01_medio_pago (
  code varchar(3) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.tab_03_entidad_financiera (
  code varchar(3) primary key,
  descripcion text not null
);

-- KARDEX - INVENTARIO
CREATE TABLE IF NOT EXISTS sunat.tab_05_tipo_existencia (
  code varchar(3) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.tab_11_aduana (
  code varchar(3) primary key,
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.tab_12_tipo_operacion (
  code varchar(3) primary key,
  descripcion text not null
);


-- PASO 4: SISTEMA DE ROLES Y PERMISOS (JSONB OPTIMIZADO, FUSIONADO)
-- ============================================================================

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    constraints JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hierarchy_level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT chk_permissions_array CHECK (jsonb_typeof(permissions) = 'array'),
    CONSTRAINT chk_hierarchy_level CHECK (hierarchy_level BETWEEN 0 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_permissions ON public.roles USING GIN(permissions);

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 5: EMPRESAS CON ENCRIPTACIÓN Y AUDITORÍA 
-- ============================================================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruc VARCHAR(11) NOT NULL UNIQUE,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    email email_address,
    phone TEXT,
    address TEXT,
    ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
    currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code) DEFAULT 'PEN',
    valuation_method TEXT NOT NULL DEFAULT 'PROMEDIO_MOVIL'
        CHECK (valuation_method IN ('FIFO', 'PROMEDIO_MOVIL', 'LIFO')),

    logo_url TEXT,
    website TEXT;

    -- Facturación electrónica (encriptada)
    sol_user TEXT,
    sol_pass TEXT, -- Será encriptada con pgcrypto
    cert_path TEXT,
    client_id TEXT,
    client_secret TEXT,
    production BOOLEAN NOT NULL DEFAULT false,

    -- Configuraciones avanzadas
    business_config JSONB DEFAULT '{}'::jsonb,
    integrations JSONB DEFAULT '{}'::jsonb,

    -- Campos de auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1
);

-- PASO 6: USER_COMPANIES CON RLS AVANZADO (FUSIONADO)
-- ============================================================================

CREATE TABLE public.user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    permissions_override JSONB DEFAULT '[]'::jsonb,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_user_companies_active UNIQUE (user_id, company_id),
    CONSTRAINT chk_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_role_id ON public.user_companies(role_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_is_active ON public.user_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_company ON public.user_companies(user_id, company_id);

CREATE TRIGGER update_user_companies_updated_at
    BEFORE UPDATE ON public.user_companies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();


CREATE TABLE company_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tax_type VARCHAR(4) NOT NULL REFERENCES sunat.cat_05_tipos_tributo(code),  -- IGV, ISC, etc.
    rate PERCENTAGE NOT NULL DEFAULT 18.0,  -- e.g., 18% IGV
    effective_from DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, tax_type, effective_from)
);


-- PASO 7: SUCURSALES, ALMACENES Y ZONAS (DE VERSIÓN BASE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  ubigeo_code varchar(6) references sunat.ubigeo(code),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, code)
);

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  code text not null,
  name text not null,

  -- Dimensiones físicas totales del almacén (en metros)
  width numeric(18,6) not null default 0,
  height numeric(18,6) not null default 0,
  length numeric(18,6) not null default 0,
  total_area numeric(18,6) generated always as (width * length) stored,
  total_volume numeric(18,6) generated always as (width * length * height) stored,

  -- Información de ubicación física
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude numeric(10,8),    -- Coordenadas GPS
  longitude numeric(11,8),   -- Coordenadas GPS

  -- Configuración del almacén
  warehouse_type text DEFAULT 'GENERAL' CHECK (warehouse_type IN (
    'GENERAL', 'COLD_STORAGE', 'HAZARDOUS', 'BONDED', 'HIGH_VALUE', 'BULK_STORAGE'
  )),
  temperature_zone text CHECK (temperature_zone IN (
    'AMBIENT', 'REFRIGERATED', 'FROZEN', 'CONTROLLED'
  )),
  max_capacity_kg numeric(18,6),
  current_capacity_kg numeric(18,6) DEFAULT 0,

  -- Estado operacional
  is_active boolean DEFAULT true,
  operational_status text DEFAULT 'OPERATIONAL' CHECK (operational_status IN (
    'OPERATIONAL', 'MAINTENANCE', 'CLOSED', 'UNDER_CONSTRUCTION'
  )),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, code)
);

CREATE INDEX idx_warehouses_company ON warehouses(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_branch ON warehouses(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_geo ON warehouses(latitude, longitude) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_type ON warehouses(warehouse_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_status ON warehouses(operational_status) WHERE deleted_at IS NULL;

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  code text not null,
  name text,
  -- Dimensiones físicas
  width numeric(18,6) not null default 0,
  height numeric(18,6) not null default 0,
  length numeric(18,6) not null default 0,
  capacity_kg numeric(18,6),

  -- Coordenadas de posición (en metros desde el punto de origen del almacén)
  x_coordinate numeric(18,6) DEFAULT 0, -- Distancia horizontal desde origen
  y_coordinate numeric(18,6) DEFAULT 0, -- Distancia vertical desde origen
  z_coordinate numeric(18,6) DEFAULT 0, -- Altura (para almacenes multi-nivel)
  rotation_degrees numeric(18,6) DEFAULT 0, -- Rotación de la zona

  -- Tipo de forma y definición
  shape_type text DEFAULT 'RECTANGLE' CHECK (shape_type IN ('RECTANGLE', 'SQUARE', 'CIRCLE', 'POLYGON')),
  vertices jsonb DEFAULT '[]'::jsonb, -- Para formas poligonales: [{"x":0, "y":0}, {"x":5, "y":0}, {"x":5, "y":3}, {"x":0, "y":3}]

  -- Metadata visual
  color_hex text DEFAULT '#3B82F6' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  opacity numeric(3,2) DEFAULT 0.7 CHECK (opacity BETWEEN 0 AND 1),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(warehouse_id, code)
);


-- PASO 8: PROVEEDORES Y CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS parties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  is_customer boolean not null default false,
  is_supplier boolean not null default false,
  doc_type varchar(1) not null references sunat.cat_06_doc_identidad(code),
  doc_number text not null,
  apellido_paterno text,
  apellido_materno text,
  nombres text,
  razon_social text,
  fullname TEXT GENERATED ALWAYS AS (
    COALESCE(razon_social,
      TRIM(COALESCE(apellido_paterno,'') || ' ' || COALESCE(apellido_materno,'') || ' ' || COALESCE(nombres,'')))
  ) STORED,
  email text,
  phone text,
  address text,
  ubigeo_code varchar(6) references sunat.ubigeo(code),
  country_code varchar(2) default 'PE',
  establishments JSONB[], 
  representatives JSONB[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, doc_type, doc_number),
  check (is_customer or is_supplier)
);

CREATE INDEX IF NOT EXISTS idx_parties_doc ON parties(company_id, doc_type, doc_number);
CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS party_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  sequence INT, -- útil si quieres definir rutas
  is_primary BOOLEAN DEFAULT FALSE, -- por si una party tiene varias ubicaciones
  description TEXT, -- opcional, nombre del punto (ej: "almacén central")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Rápido acceso a ubicaciones por party
CREATE INDEX IF NOT EXISTS idx_party_locations_party_id ON party_locations(party_id);
-- Rápido acceso a la ubicación principal
CREATE INDEX IF NOT EXISTS idx_party_locations_primary ON party_locations(party_id, is_primary);

-- Desactiva is_primary en todas las otras ubicaciones de la misma party.
CREATE OR REPLACE FUNCTION enforce_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando esta ubicación como principal
  IF NEW.is_primary THEN
    -- Desactivar todas las otras ubicaciones principales de esta party
    UPDATE party_locations
    SET is_primary = FALSE
    WHERE party_id = NEW.party_id
      AND id <> NEW.id
      AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_party_locations_primary
BEFORE INSERT OR UPDATE ON party_locations
FOR EACH ROW
WHEN (NEW.is_primary IS TRUE)
EXECUTE FUNCTION enforce_single_primary_location();


CREATE TABLE IF NOT EXISTS party_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  party_id uuid not null references parties(id) on delete cascade,
  name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

CREATE TRIGGER update_party_contacts_updated_at BEFORE UPDATE ON party_contacts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS party_establecimientos (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id) on delete cascade,
  codigo varchar(50),
  tipo_establecimiento varchar(150),
  actividad_economica varchar(150),
  direccion text,
  ubigeo_sunat varchar(6) references sunat.ubigeo(code),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS party_representantes (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id) on delete cascade,
  tipo_de_documento varchar(8) ,
  numero_de_documento varchar(15),
  nombre varchar(250),
  cargo text,
  fecha_desde date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- PASO 9: MARCAS, CATEGORÍAS Y PRODUCTOS (FUSIONADO Y OPTIMIZADO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  code text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(active);
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  code text,
  active boolean default true,
  level integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code) ON DELETE CASCADE,
    tipo_afectacion VARCHAR(2) NOT NULL REFERENCES sunat.cat_07_afect_igv(code) ON DELETE CASCADE,
    -- Dimensiones físicas
    width NUMERIC(18,6) DEFAULT 0,
    height NUMERIC(18,6) DEFAULT 0,
    length NUMERIC(18,6) DEFAULT 0,
    weight_kg quantity DEFAULT 0,
    volume_m3 NUMERIC(18,6) GENERATED ALWAYS AS (COALESCE(width,0)*COALESCE(height,0)*COALESCE(length,0)) STORED,

    -- Control de inventario
    is_serialized BOOLEAN DEFAULT false,
    is_batch_controlled BOOLEAN DEFAULT false,
    min_stock quantity DEFAULT 0,
    max_stock quantity DEFAULT 0,
    reorder_point quantity DEFAULT 0,

    -- Estado y metadatos
    active BOOLEAN DEFAULT true,
    tags TEXT[],
    search_vector TSVECTOR,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_products_company_sku UNIQUE (company_id, sku),
    CONSTRAINT chk_stock_levels CHECK (max_stock >= min_stock)
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(company_id, sku);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_unit_code ON products(unit_code);
CREATE INDEX idx_brands_company ON brands(company_id);
CREATE INDEX idx_categories_company ON categories(company_id);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Otras tablas relacionadas con productos 
CREATE TABLE IF NOT EXISTS product_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS product_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  code_type text not null, -- 'EAN','UPC','SKU_ALT','SERIE','LOTE'
  code_value text not null,
  unique(product_id, code_type, code_value)
);

-- Nueva tabla: Atributos de producto
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'TEXT', -- TEXT, NUMBER, BOOLEAN, DATE
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, name)
);

-- Nueva tabla: Valores de atributos para productos
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC(18,6),
  value_boolean BOOLEAN,
  value_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, attribute_id)
);

CREATE TABLE IF NOT EXISTS product_purchase_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  supplier_id uuid not null references parties(id) on delete restrict,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  unit_price numeric(18,6) not null,
  observed_at date not null,
  source_doc_type varchar(2) references sunat.cat_01_tipo_documento(code),
  source_doc_series text,
  source_doc_number text,
  created_at timestamptz default now(),
  unique(company_id, product_id, supplier_id, observed_at, source_doc_type, source_doc_series, source_doc_number)
);

-- Historial completo de precios (ventas/compras) para análisis de tendencias y auditoría. Evita recalcular en queries.
CREATE TABLE product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_type TEXT NOT NULL CHECK (price_type IN ('PURCHASE', 'SALE')),  -- Distingue compra/venta
    unit_price NUMERIC(18,6) NOT NULL,
    currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
    effective_from DATE NOT NULL,
    effective_to DATE,
    source_doc_id UUID,  -- Referencia a sales_docs o purchase_docs
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_product_price_history_product ON product_price_history(product_id, effective_from);

-- Ubicaciones de productos en almacén (coordenadas 3D)
CREATE TABLE IF NOT EXISTS product_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_zone_id UUID REFERENCES warehouse_zones(id) ON DELETE CASCADE,
    position_x NUMERIC(8,2),
    position_y NUMERIC(8,2),
    position_z NUMERIC(8,2),
    capacity_max NUMERIC(10,2) CHECK (capacity_max >= 0), -- Capacidad máxima en esta ubicación
    stock_actual NUMERIC(10,2) DEFAULT 0 CHECK (stock_actual >= 0),
    es_principal BOOLEAN DEFAULT false, -- Ubicación principal del producto
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PASO 10: TABLAS PARA LOTES Y SERIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    manufacture_date DATE,
    purchase_doc_id UUID, -- Referencia al documento de compra
    expiry_date DATE,
    qty_initial NUMERIC(18,6) NOT NULL,
    qty_available NUMERIC(18,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- PASO 11: LISTAS DE PRECIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    serial_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'SOLD', 'RETURNED', 'DEFECTIVE')),
    purchase_doc_id UUID, -- Referencia al documento de compra
    purchase_date DATE,
    sale_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_product_serials_product ON product_serials(product_id);
CREATE TRIGGER update_product_serials_updated_at BEFORE UPDATE ON product_serials FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS price_lists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, name)
);

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS price_list_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  price_list_id uuid not null references price_lists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  unit_price numeric(18,6) not null,
  valid_from date not null,
  valid_to date,
  unique(price_list_id, product_id, valid_from)
);

-- Nueva tabla: Descuentos y promociones
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE', -- PERCENTAGE, FIXED_AMOUNT
  value NUMERIC(18,6) NOT NULL,
  applicable_to TEXT NOT NULL DEFAULT 'PRODUCTS', -- PRODUCTS, CATEGORIES, ALL
  min_quantity NUMERIC(18,6) DEFAULT 0,
  min_amount NUMERIC(18,6) DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Nueva tabla: Aplicación de descuentos a productos
CREATE TABLE IF NOT EXISTS discount_products (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(discount_id, product_id)
);

-- Nueva tabla: Aplicación de descuentos a categorías
CREATE TABLE IF NOT EXISTS discount_categories (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(discount_id, category_id)
);

-- PASO 12: VEHÍCULOS Y CONDUCTORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  plate text not null,
  provider_party_id uuid references parties(id) on delete set null, -- terceros
  brand text,
  model text,
  year int,
  own boolean default true,
  capacity_kg numeric(18,6),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, plate)
);

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


CREATE TABLE IF NOT EXISTS vehicle_realtime_status (
  vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  speed_kph NUMERIC(6, 2),
  heading_deg NUMERIC(5, 2), -- dirección del vehículo en grados (0-360)
  status TEXT CHECK (status IN ('active', 'idle', 'stopped', 'maintenance')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_position_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  speed_kph NUMERIC(6, 2),
  heading_deg NUMERIC(5, 2),
  status TEXT CHECK (status IN ('active', 'idle', 'stopped', 'maintenance')),
  change_type TEXT CHECK (change_type IN ('position', 'speed', 'status', 'multiple')),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_logs_vehicle_id ON vehicle_position_logs(vehicle_id);
CREATE INDEX idx_vehicle_logs_reported_at ON vehicle_position_logs(reported_at);

CREATE TABLE IF NOT EXISTS drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  party_id uuid not null references parties(id) on delete restrict,
  license_number text not null,
  license_class text,
  valid_until date,
  numero_documento varchar(15),
  nombre_completo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, license_number)
);

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Relación many-to-many entre vehículos y conductores
CREATE TABLE vehicle_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assignment_date DATE DEFAULT CURRENT_DATE,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, driver_id)
);


-- PASO 13: DOCUMENTOS DE COMPRAS
-- ============================================================================
-- Órdenes de compra (pendientes antes de facturas/recepciones)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
    exchange_rate NUMERIC(18,6),
    total_amount NUMERIC(18,6) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_status ON purchase_orders(company_id, status);
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    description TEXT,
    unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
    quantity NUMERIC(18,6) NOT NULL,
    unit_price NUMERIC(18,6) NOT NULL,
    discount_pct NUMERIC(18,6) DEFAULT 0,
    total_line NUMERIC(18,6) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_pct / 100)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- (afecta stock al recibir mercancía de compras)
CREATE TABLE IF NOT EXISTS purchase_docs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  supplier_id uuid not null references parties(id) on delete restrict,
  doc_type varchar(2) not null references sunat.cat_01_tipo_documento(code),
  series text not null,
  number text not null,
  issue_date date not null,
  arrival_date date,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  exchange_rate numeric(18,6),
  op_type_kardex varchar(3) references sunat.cat_12_tipo_operacion(code),
  total_ope_gravadas numeric(18,6) default 0,
  total_ope_exoneradas numeric(18,6) default 0,
  total_ope_inafectas numeric(18,6) default 0,
  total_igv numeric(18,6) default 0,
  total_isc numeric(18,6) default 0,
  total_descuentos numeric(18,6) default 0,
  total_otros_cargos numeric(18,6) default 0,
  total numeric(18,6) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at TIMESTAMPTZ,
  unique(company_id, doc_type, series, number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_unique ON purchase_docs(company_id, doc_type, series, number);
CREATE TRIGGER update_purchase_docs_updated_at BEFORE UPDATE ON purchase_docs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS purchase_doc_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_doc_id uuid not null references purchase_docs(id) on delete cascade,
  product_id uuid not null references products(id),
  description text,
  unit_code varchar(10) not null references sunat.cat_03_unidades_medida(code),
  quantity numeric(18,6) not null,
  unit_cost numeric(18,6) not null, -- sin IGV
  discount_pct numeric(18,6) default 0,
  type_price varchar(2) default '01' references sunat.cat_16_tipo_precio_unitario(code),
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  igv_amount numeric(18,6) default 0,
  isc_amount numeric(18,6) default 0,
  total_line numeric(18,6) not null, -- sin IGV
  created_at timestamptz default now()
);

-- Recepciones 
CREATE TABLE IF NOT EXISTS receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    purchase_doc_id UUID REFERENCES purchase_docs(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    reception_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('PARTIAL', 'COMPLETE', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receptions_warehouse_status ON receptions(warehouse_id, status);
CREATE TRIGGER update_receptions_updated_at BEFORE UPDATE ON receptions FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS reception_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL REFERENCES receptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(18,6) NOT NULL,
    unit_cost NUMERIC(18,6) NOT NULL,
    batch_number TEXT,  -- Opcional para lotes
    serial_number TEXT, -- Opcional para series
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 14: DOCUMENTOS DE VENTAS
-- ============================================================================
-- Órdenes de venta
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
    exchange_rate NUMERIC(18,6),
    total_amount NUMERIC(18,6) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_company_status ON sales_orders(company_id, status);
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,6) NOT NULL,
    unit_price NUMERIC(18,6) NOT NULL,
    discount_pct NUMERIC(18,6) DEFAULT 0,
    total_line NUMERIC(18,6) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_pct / 100)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_docs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid not null references parties(id) on delete restrict,
  doc_type varchar(2) not null, -- Factura/Boleta, etc.
  series text not null,
  number bigint not null,
  issue_date date not null,
  currency_code varchar(3) not null references sunat.cat_02_monedas(code),
  exchange_rate numeric(18,6),
  op_type_venta varchar(2) references sunat.cat_17_tipo_operacion(code),
  op_type_kardex varchar(3) references sunat.cat_12_tipo_operacion(code),
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  total_ope_gravadas numeric(18,6) default 0,
  total_ope_exoneradas numeric(18,6) default 0,
  total_ope_inafectas numeric(18,6) default 0,
  total_igv numeric(18,6) default 0,
  total_isc numeric(18,6) default 0,
  total_descuentos numeric(18,6) default 0,
  total_otros_cargos numeric(18,6) default 0,
  total numeric(18,6) not null,
  notes text,
  greenter_xml bytea,
  greenter_cdr bytea,
  greenter_hash text,
  greenter_ticket text,
  greenter_status text,
  error_message text,
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(company_id, doc_type, series, number)
);

CREATE INDEX IF NOT EXISTS idx_sales_unique ON sales_docs(company_id, doc_type, series, number);
CREATE TRIGGER update_sales_docs_updated_at BEFORE UPDATE ON sales_docs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS sales_doc_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sales_doc_id uuid not null references sales_docs(id) on delete cascade,
  line_number bigint not null default 1,
  product_id uuid not null references products(id),
  description text,
  unit_code varchar(10) not null references sunat.cat_03_unidades_medida(code),
  quantity numeric(18,6) not null,
  unit_price numeric(18,6) not null, -- sin IGV
  discount_pct numeric(18,6) default 0,
  type_price varchar(2) default '01' references sunat.cat_16_tipo_precio_unitario(code),
  igv_affectation varchar(2) default '10' references sunat.cat_07_afect_igv(code),
  igv_amount numeric(18,6) default 0,
  isc_amount numeric(18,6) default 0,
  total_line numeric(18,6) not null, -- sin IGV
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_sales_doc_items_doc_line ON sales_doc_items (sales_doc_id, line_number);

-- Envíos (afecta stock al enviar mercancía de ventas)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    sales_doc_id UUID REFERENCES sales_docs(id) ON DELETE SET NULL,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'SHIPPED' CHECK (status IN ('PARTIAL', 'COMPLETE', 'RETURNED')),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_warehouse_status ON shipments(warehouse_id, status);
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_shipped NUMERIC(18,6) NOT NULL,
    batch_number TEXT,
    serial_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controla la configuración de series por empresa, tipo de documento y almacén (opcional).
CREATE TABLE public.document_series (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type_code VARCHAR(4) NOT NULL references sunat.cat_01_tipo_documento(code) ON DELETE CASCADE, -- Ej: 01 = Factura, 03 = Boleta
    series VARCHAR(4) NOT NULL, -- Ej: F001, B001
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, document_type_code, series)
);

-- Registra el último número usado para cada combinación de empresa + tipo de documento + serie.

CREATE TABLE public.document_counters (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type_code VARCHAR(4) NOT NULL,
    series VARCHAR(4) NOT NULL,
    last_number BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (company_id, document_type_code, series)
);

-- ============ INICIO::INVENTARIO ============
-- PASO 13: GESTIÓN DE INVENTARIOS CON PARTICIONAMIENTO
-- ============================================================================

-- Tabla de stock ledger particionada por fecha
CREATE TABLE public.stock_ledger (
    id UUID DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_date DATE NOT NULL,

    -- Referencias del documento
    ref_doc_type VARCHAR(2) references sunat.cat_01_tipo_documento(code),
    ref_doc_series TEXT,
    ref_doc_number TEXT,
    operation_type VARCHAR(2) references sunat.cat_12_tipo_operacion(code),

    -- Cantidades y costos
    qty_in quantity DEFAULT 0,
    qty_out quantity DEFAULT 0,
    
    -- Costos en moneda original
    original_currency_code VARCHAR(3) REFERENCES sunat.cat_02_monedas(code),
    exchange_rate NUMERIC(18, 6),
    original_unit_cost_in monetary,
    original_total_cost_in monetary,

    -- Costos en moneda base de la compañia
    unit_cost_in monetary,
    total_cost_in monetary,
    unit_cost_out monetary,
    total_cost_out monetary,

    -- Saldos calculados
    balance_qty quantity NOT NULL DEFAULT 0,
    balance_unit_cost monetary,
    balance_total_cost monetary,

    -- Metadatos
    source TEXT,
    source_id UUID,
    batch_id UUID,
    serial_numbers TEXT[],
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Nueva columna agregada para soft delete

    PRIMARY KEY (id, movement_date)
) PARTITION BY RANGE (movement_date);

CREATE INDEX idx_stock_ledger_operation_type ON stock_ledger(operation_type, movement_date);

-- Crear particiones para los próximos 24 meses
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
    year_month TEXT;
BEGIN
    start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months');

    FOR i IN 0..35 LOOP
        end_date := start_date + INTERVAL '1 month';
        year_month := TO_CHAR(start_date, 'YYYY_MM');
        partition_name := 'stock_ledger_' || year_month;

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS partitions.%I PARTITION OF public.stock_ledger
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );

        -- Índices específicos por partición
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_product_date
            ON partitions.%I (company_id, product_id, movement_date)',
            partition_name, partition_name
        );

        start_date := end_date;
    END LOOP;
END $$
;

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_date ON stock_ledger(company_id, product_id, movement_date);

-- Tabla de stock agregado
CREATE TABLE IF NOT EXISTS warehouse_stock (
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  balance_qty numeric(18,6) not null default 0,
  primary key (warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  transfer_date DATE NOT NULL,
  reason VARCHAR(2) REFERENCES sunat.cat_20_motivo_traslado(code),
  modality VARCHAR(2) REFERENCES sunat.cat_18_modalidad_traslado(code),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL
);

-- Nueva tabla: Ajustes de inventario
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  adjustment_date DATE NOT NULL,
  adjustment_type TEXT NOT NULL, -- INCREMENTO, DECREMENTO
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, APROBADO, COMPLETADO, CANCELADO
  total_value NUMERIC(18,6) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: Items de ajustes de inventario
CREATE TABLE IF NOT EXISTS inventory_adjustment_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  adjustment_id UUID NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(18,6) NOT NULL,
  unit_cost NUMERIC(18,6) NOT NULL,
  total_cost NUMERIC(18,6) NOT NULL,
  notes TEXT
);

-- Nueva tabla: Conteo físico de inventario
CREATE TABLE IF NOT EXISTS physical_inventory_counts (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  count_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, EN_PROCESO, COMPLETADO, CANCELADO
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: Items de conteo físico
CREATE TABLE IF NOT EXISTS physical_inventory_count_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  count_id UUID NOT NULL REFERENCES physical_inventory_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  system_quantity NUMERIC(18,6) NOT NULL,
  counted_quantity NUMERIC(18,6) NOT NULL,
  variance NUMERIC(18,6) NOT NULL,
  notes TEXT
);

-- ============ FIN::INVENTARIO ============

-- Crear tabla para tasas de cambio
CREATE TABLE public.exchange_rates (
    id SERIAL PRIMARY KEY,
    /* company_id UUID NOT NULL references companies(id), */
    rate_date DATE NOT NULL,
    from_currency_code CHAR(3) NOT NULL references sunat.cat_02_monedas(code),
    to_currency_code CHAR(3) NOT NULL references sunat.cat_02_monedas(code),
    rate DECIMAL(10, 5) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricción para evitar tasas de cambio duplicadas para la misma fecha y monedas
    CONSTRAINT unique_exchange_rate UNIQUE (rate_date, from_currency_code, to_currency_code),
    
    -- Verificar que las monedas sean diferentes
    CONSTRAINT different_currencies CHECK (from_currency_code <> to_currency_code),
    
    -- Verificar que la tasa sea positiva
    CONSTRAINT positive_rate CHECK (rate > 0)
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(rate_date);
CREATE INDEX idx_exchange_rates_currency_pair ON public.exchange_rates(from_currency_code, to_currency_code);

-- Opcional: Crear un trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auditoría detallada, historial y configuraciones dinámicas.

CREATE TRIGGER update_exchange_rates_updated_at
    BEFORE UPDATE ON public.exchange_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE audit.changes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_changes_log_table_operation ON audit.changes_log(table_name, operation);

-- CURRENT V_CURRENT_STOCK Y V_INVENTORY_VALUATION  NO REALIZAN EL TRIGUERS DESDE LA TABLA RECEPTION O SHIPMENT