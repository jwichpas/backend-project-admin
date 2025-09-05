<
3
3
-- Habilitar extensiones comunes en Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============ SUNAT TABLAS ============
CREATE SCHEMA IF NOT EXISTS sunat;
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

create table if not exists sunat.cat_06_doc_identidad (
  code varchar(1) primary key, -- '1','6','7','A','B', etc.
  descripcion text not null
);

CREATE TABLE IF NOT EXISTS sunat.cat_07_afect_igv (
  code varchar(2) primary key,
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

-- =========== FIN SUNAT TABLAS ============

-- =========== INICIO::TIPO DE CAMBIO ============
CREATE TABLE IF NOT EXISTS tipo_cambio (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  fecha DATE NOT NULL,
  moneda_origen VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  moneda_destino VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  valor NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========== EMPRESA ============
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  ruc VARCHAR(11) NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code) DEFAULT 'PEN',
  valuation_method TEXT NOT NULL DEFAULT 'PROMEDIO_MOVIL' CHECK (valuation_method IN ('FIFO', 'PROMEDIO_MOVIL', 'LIFO')),
  
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
  deleted_at TIMESTAMPTZ
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



CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
  latitude numeric(10,8),    -- Coordenadas GPS
  longitude numeric(11,8),   -- Coordenadas GPS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, code)
);
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Dimensiones físicas totales del almacén (en metros)
  width NUMERIC(18,6) NOT NULL DEFAULT 0,
  height NUMERIC(18,6) NOT NULL DEFAULT 0,
  length NUMERIC(18,6) NOT NULL DEFAULT 0,
  total_area numeric(18,6) generated always as (width * length) stored,
  volume_m3 GENERATED ALWAYS AS (width * height * length) STORED,

  -- Información de ubicación física
  ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
  address text,
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

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, code)
);

CREATE INDEX idx_warehouses_company ON warehouses(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_branch ON warehouses(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_geo ON warehouses(latitude, longitude) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_type ON warehouses(warehouse_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_status ON warehouses(operational_status) WHERE deleted_at IS NULL;

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
   -- Dimensiones físicas
  width NUMERIC(18,6) NOT NULL DEFAULT 0,
  height NUMERIC(18,6) NOT NULL DEFAULT 0,
  length NUMERIC(18,6) NOT NULL DEFAULT 0,
  capacity_kg NUMERIC(18,6),
  volume_m3 GENERATED ALWAYS AS (width * height * length) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(warehouse_id, code)
);

-- Nueva tabla: Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, username),
  UNIQUE(company_id, email)
);

-- Nueva tabla: Roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, name)
);

-- Nueva tabla: Asignación de roles a usuarios
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- ============ FIN EMPRESA ============

-- ============ PROVEEDORES Y CLIENTES ============
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_customer BOOLEAN NOT NULL DEFAULT FALSE,
  is_supplier BOOLEAN NOT NULL DEFAULT FALSE,
  doc_type VARCHAR(1) NOT NULL REFERENCES sunat.cat_06_doc_identidad(code),
  doc_number TEXT NOT NULL,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  nombres TEXT,
  razon_social TEXT,
  fullname TEXT GENERATED ALWAYS AS (
    COALESCE(razon_social,
      TRIM(COALESCE(apellido_paterno,'') || ' ' || COALESCE(apellido_materno,'') || ' ' || COALESCE(nombres,'')))
  ) STORED,
  email TEXT,
  phone TEXT,
  address TEXT,
  ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
  country_code VARCHAR(2) DEFAULT 'PE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, doc_type, doc_number),
  CHECK (is_customer OR is_supplier)
);

CREATE TABLE IF NOT EXISTS party_contacts (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Nueva tabla: Direcciones adicionales para parties
CREATE TABLE IF NOT EXISTS party_addresses (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'PRINCIPAL', -- PRINCIPAL, ENTREGA, FACTURACIÓN
  address TEXT NOT NULL,
  reference TEXT,
  ubigeo_code VARCHAR(6) REFERENCES sunat.ubigeo(code),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============ FIN PROVEEDORES Y CLIENTES ============
-- ============ PRODUCTOS ============
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_06_unidades_medida(code),
  width NUMERIC(18,6) DEFAULT 0,
  height NUMERIC(18,6) DEFAULT 0,
  length NUMERIC(18,6) DEFAULT 0,
  weight_kg NUMERIC(18,6) DEFAULT 0,
  volume_m3 GENERATED ALWAYS AS (COALESCE(width,0)*COALESCE(height,0)*COALESCE(length,0)) STORED,
  is_serialized BOOLEAN DEFAULT FALSE,
  is_batch_controlled BOOLEAN DEFAULT FALSE,
  min_stock NUMERIC(18,6) DEFAULT 0,
  max_stock NUMERIC(18,6) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, sku)
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_codes (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code_type TEXT NOT NULL,
  code_value TEXT NOT NULL,
  UNIQUE(product_id, code_type, code_value)
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

-- Nueva tabla: Series de productos (para productos serializados)
CREATE TABLE IF NOT EXISTS product_series (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serie TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE', -- DISPONIBLE, VENDIDO, RESERVADO, DEFECTUOSO
  purchase_doc_id UUID, -- Referencia al documento de compra
  sales_doc_id UUID, -- Referencia al documento de venta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, product_id, serie)
);

-- Nueva tabla: Lotes de productos (para productos con control de lote)
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  expiration_date DATE,
  manufacturing_date DATE,
  purchase_doc_id UUID, -- Referencia al documento de compra
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, product_id, batch_code)
);
-- ============ FIN PRODUCTOS ============

-- ============ PRODUCTOS PRECIOS ============
CREATE TABLE IF NOT EXISTS product_purchase_prices (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  unit_price NUMERIC(18,6) NOT NULL,
  observed_at DATE NOT NULL,
  source_doc_type VARCHAR(2) REFERENCES sunat.cat_10_tipo_documento(code),
  source_doc_series TEXT,
  source_doc_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, product_id, supplier_id, observed_at, source_doc_type, source_doc_series, source_doc_number)
);

CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_price NUMERIC(18,6) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE,
  UNIQUE(price_list_id, product_id, valid_from)
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

-- ============ FIN PRODUCTOS PRECIOS ============

-- ============ VEHICULOS Y CONDUCTORES ============
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  provider_party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  year INT,
  own BOOLEAN DEFAULT TRUE,
  capacity_kg NUMERIC(18,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, plate)
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  license_number TEXT NOT NULL,
  license_class TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, license_number)
);

CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  UNIQUE(vehicle_id, driver_id, assigned_at)
);
-- ============ FIN::VEHICULOS Y CONDUCTORES ============

-- ============ INICIO::VENTAS Y FACTURACION ============
-- Nueva tabla: Órdenes de venta
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, PENDIENTE, PARCIAL, COMPLETADA, CANCELADA
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  subtotal NUMERIC(18,6) DEFAULT 0,
  total_discount NUMERIC(18,6) DEFAULT 0,
  total_tax NUMERIC(18,6) DEFAULT 0,
  total NUMERIC(18,6) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: Items de órdenes de venta
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT,
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL,
  unit_price NUMERIC(18,6) NOT NULL,
  discount_pct NUMERIC(18,6) DEFAULT 0,
  total_line NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_docs (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  doc_type VARCHAR(2) NOT NULL,
  series TEXT NOT NULL,
  number BIGINT NOT NULL,
  issue_date DATE NOT NULL,
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  exchange_rate NUMERIC(18,6),
  op_type VARCHAR(4) REFERENCES sunat.cat_17_tipo_operacion(code),
  op_type_kardex VARCHAR(3) REFERENCES sunat.tab_12_tipo_operacion(code),
  igv_affectation VARCHAR(2) DEFAULT '10' REFERENCES sunat.cat_07_afect_igv(code),
  total_ope_gravadas NUMERIC(18,6) DEFAULT 0,
  total_ope_exoneradas NUMERIC(18,6) DEFAULT 0,
  total_ope_inafectas NUMERIC(18,6) DEFAULT 0,
  total_igv NUMERIC(18,6) DEFAULT 0,
  total_isc NUMERIC(18,6) DEFAULT 0,
  total_descuentos NUMERIC(18,6) DEFAULT 0,
  total_otros_cargos NUMERIC(18,6) DEFAULT 0,
  total NUMERIC(18,6) NOT NULL,
  notes TEXT,
  greenter_xml BYTEA,
  greenter_cdr BYTEA,
  greenter_hash TEXT,
  greenter_ticket TEXT,
  greenter_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, doc_type, series, number)
);

CREATE TABLE IF NOT EXISTS sales_doc_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sales_doc_id UUID NOT NULL REFERENCES sales_docs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT,
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL,
  unit_price NUMERIC(18,6) NOT NULL,
  discount_pct NUMERIC(18,6) DEFAULT 0,
  igv_affectation VARCHAR(2) DEFAULT '10' REFERENCES sunat.cat_07_afect_igv(code),
  igv_amount NUMERIC(18,6) DEFAULT 0,
  isc_amount NUMERIC(18,6) DEFAULT 0,
  total_line NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============ FIN::VENTAS Y FACTURACION ============

-- ============ INICIO::COMPRAS ============

-- Nueva tabla: Órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL,
  expected_arrival_date DATE,
  status TEXT NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, PENDIENTE, PARCIAL, COMPLETADA, CANCELADA
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  subtotal NUMERIC(18,6) DEFAULT 0,
  total_discount NUMERIC(18,6) DEFAULT 0,
  total_tax NUMERIC(18,6) DEFAULT 0,
  total NUMERIC(18,6) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: Items de órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT,
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_03_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL,
  unit_cost NUMERIC(18,6) NOT NULL,
  discount_pct NUMERIC(18,6) DEFAULT 0,
  total_line NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_docs (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
  doc_type VARCHAR(2) NOT NULL REFERENCES sunat.cat_10_tipo_documento(code),
  series TEXT NOT NULL,
  number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  arrival_date DATE,
  currency_code VARCHAR(3) NOT NULL REFERENCES sunat.cat_02_monedas(code),
  exchange_rate NUMERIC(18,6),
  op_type VARCHAR(3) REFERENCES sunat.tab_12_tipo_operacion(code),
  total_ope_gravadas NUMERIC(18,6) DEFAULT 0,
  total_ope_exoneradas NUMERIC(18,6) DEFAULT 0,
  total_ope_inafectas NUMERIC(18,6) DEFAULT 0,
  total_igv NUMERIC(18,6) DEFAULT 0,
  total_isc NUMERIC(18,6) DEFAULT 0,
  total_descuentos NUMERIC(18,6) DEFAULT 0,
  total_otros_cargos NUMERIC(18,6) DEFAULT 0,
  total NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, doc_type, series, number)
);

CREATE TABLE IF NOT EXISTS purchase_doc_items (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  purchase_doc_id UUID NOT NULL REFERENCES purchase_docs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT,
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_06_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL,
  unit_cost NUMERIC(18,6) NOT NULL,
  discount_pct NUMERIC(18,6) DEFAULT 0,
  igv_affectation VARCHAR(2) DEFAULT '10' REFERENCES sunat.cat_07_afect_igv(code),
  igv_amount NUMERIC(18,6) DEFAULT 0,
  isc_amount NUMERIC(18,6) DEFAULT 0,
  total_line NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FIN::COMPRAS ============

-- ============ INICIO::INVENTARIO ============
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_date DATE NOT NULL,
  ref_doc_type VARCHAR(2) REFERENCES sunat.cat_10_tipo_documento(code),
  ref_doc_series TEXT,
  ref_doc_number TEXT,
  operation_type VARCHAR(2) REFERENCES sunat.cat_12_tipo_operacion(code),
  qty_in NUMERIC(18,6) DEFAULT 0,
  qty_out NUMERIC(18,6) DEFAULT 0,
  unit_cost_in NUMERIC(18,6),
  total_cost_in NUMERIC(18,6),
  unit_cost_out NUMERIC(18,6),
  total_cost_out NUMERIC(18,6),
  balance_qty NUMERIC(18,6) NOT NULL DEFAULT 0,
  balance_unit_cost NUMERIC(18,6),
  balance_total_cost NUMERIC(18,6),
  source TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  unit_code VARCHAR(10) NOT NULL REFERENCES sunat.cat_06_unidades_medida(code),
  quantity NUMERIC(18,6) NOT NULL
);

-- Stock agregado por almacén
CREATE TABLE IF NOT EXISTS warehouse_stock (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  balance_qty NUMERIC(18,6) NOT NULL DEFAULT 0,
  PRIMARY KEY (warehouse_id, product_id)
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
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
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
  created_by UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
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

-- ============ INDEXES Y TRIGGERS ============
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_date ON stock_ledger(company_id, product_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_sales_unique ON sales_docs(company_id, doc_type, series, number);
CREATE INDEX IF NOT EXISTS idx_purchase_unique ON purchase_docs(company_id, doc_type, series, number);
CREATE INDEX IF NOT EXISTS idx_parties_doc ON parties(company_id, doc_type, doc_number);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(company_id, sku);

-- Nuevos índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_docs_customer ON sales_docs(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_docs_date ON sales_docs(company_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_purchase_docs_supplier ON purchase_docs(company_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_docs_date ON purchase_docs(company_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_warehouse ON stock_ledger(company_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(company_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON sales_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_status ON purchase_orders(company_id, status);

-- ============ FIN INDEXES Y TRIGGERS ============

-- ============ VIEWS ============
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