-- 1. Tipos de Documento (cat_01_tipo_documento)
INSERT INTO sunat.cat_01_tipo_documento (code, descripcion) VALUES
('01', 'FACTURA'),
('03', 'BOLETA DE VENTA'),
('07', 'NOTA DE CREDITO'),
('08', 'NOTA DE DEBITO'),
('09', 'GUIA DE REMISION REMITENTE'),
('20', 'COMPROBANTE DE RETENCION')
ON CONFLICT (code) DO NOTHING;

-- 2. Monedas (cat_02_monedas)
INSERT INTO sunat.cat_02_monedas (code, descripcion) VALUES
('PEN', 'NUEVOS SOLES'),
('USD', 'DÓLAR AMERICANO'),
('CLP', 'PESO CHILENO')
ON CONFLICT (code) DO NOTHING;

-- 3. Unidades de Medida (cat_03_unidades_medida)
INSERT INTO sunat.cat_03_unidades_medida (code, descripcion) VALUES
('KGM', 'KILOGRAMO'),
('MTR', 'METRO'),
('NIU', 'UNIDAD'),
('LTR', 'LITRO'),
('BX', 'CAJA'),
('PK', 'PAQUETE')
ON CONFLICT (code) DO NOTHING;

-- 4. Tipos de Tributo (cat_05_tipos_tributo)
INSERT INTO sunat.cat_05_tipos_tributo (code, descripcion) VALUES
('1000', 'IGV'),
('2000', 'ISC'),
('9999', 'OTROS')
ON CONFLICT (code) DO NOTHING;

-- 5. Afectación IGV (cat_07_afect_igv)
INSERT INTO sunat.cat_07_afect_igv (code, descripcion) VALUES
('10', 'GRAVADO - OPERACIÓN ONEROSA'),
('20', 'EXONERADO - OPERACIÓN ONEROSA'),
('30', 'INAFECTO - OPERACIÓN ONEROSA')
ON CONFLICT (code) DO NOTHING;

-- 6. Documento de Identidad (cat_06_doc_identidad)
INSERT INTO sunat.cat_06_doc_identidad (code, descripcion) VALUES
('1', 'DNI'),
('6', 'RUC'),
('7', 'PASAPORTE'),
('A', 'CEDULA DIPLOMATICA')
ON CONFLICT (code) DO NOTHING;

-- 7. Tipo Operación (cat_12_tipo_operacion)
INSERT INTO sunat.cat_12_tipo_operacion (code, descripcion) VALUES
('01', 'VENTA INTERNA'),
('02', 'COMPRA'),
('03', 'CONSIGNACION RECIBIDA'),
('04', 'CONSIGNACION ENTREGADA'),
('11', 'TRANSFERENCIA ENTRE ALMACENES'),
('16', 'SALDO INICIAL')
ON CONFLICT (code) DO NOTHING;

-- 8. Tipo Precio Unitario (cat_16_tipo_precio_unitario)
INSERT INTO sunat.cat_16_tipo_precio_unitario (code, descripcion) VALUES
('01', 'PRECIO UNITARIO (INCLUYE IGV)'),
('02', 'VALOR REFERENCIAL UNITARIO')
ON CONFLICT (code) DO NOTHING;

-- 9. Tipo Operación Ventas (cat_17_tipo_operacion)
INSERT INTO sunat.cat_17_tipo_operacion (code, descripcion) VALUES
('0101', 'VENTA INTERNA'),
('0112', 'VENTA SUJETA A CONFIRMACIÓN')
ON CONFLICT (code) DO NOTHING;

-- 10. Modalidad Traslado (cat_18_modalidad_traslado)
INSERT INTO sunat.cat_18_modalidad_traslado (code, descripcion) VALUES
('01', 'TRANSPORTE PÚBLICO'),
('02', 'TRANSPORTE PRIVADO')
ON CONFLICT (code) DO NOTHING;

-- 11. Motivo Traslado (cat_20_motivo_traslado)
INSERT INTO sunat.cat_20_motivo_traslado (code, descripcion) VALUES
('01', 'VENTA'),
('02', 'COMPRA'),
('04', 'TRASLADO ENTRE ESTABLECIMIENTOS')
ON CONFLICT (code) DO NOTHING;

-- 12. Ubigeo (algunos ejemplos)
INSERT INTO sunat.ubigeo (code, departamento, provincia, distrito) VALUES
('150101', 'LIMA', 'LIMA', 'LIMA'),
('150103', 'LIMA', 'LIMA', 'ATE'),
('150105', 'LIMA', 'LIMA', 'BREÑA'),
('070101', 'CALLAO', 'CALLO', 'CALLAO'),
('010101', 'AMAZONAS', 'CHACHAPOYAS', 'CHACHAPOYAS')
ON CONFLICT (code) DO NOTHING;

-- 13. Medios de Pago (tab_01_medio_pago)
INSERT INTO sunat.tab_01_medio_pago (code, descripcion) VALUES
('001', 'EFECTIVO'),
('002', 'TARJETA DE CRÉDITO'),
('003', 'TARJETA DE DÉBITO'),
('004', 'TRANSFERENCIA'),
('005', 'YAPE/PLIN')
ON CONFLICT (code) DO NOTHING;

-- 14. Entidades Financieras (tab_03_entidad_financiera)
INSERT INTO sunat.tab_03_entidad_financiera (code, descripcion) VALUES
('001', 'BCP'),
('002', 'BBVA'),
('003', 'INTERBANK'),
('004', 'SCOTIABANK'),
('005', 'BANCO DE LA NACIÓN')
ON CONFLICT (code) DO NOTHING;

-- 15. Roles básicos del sistema
INSERT INTO public.roles (name, description, permissions, hierarchy_level) VALUES
('Administrador', 'Acceso completo al sistema', '["*"]', 10),
('Gerente', 'Gestión de operaciones y reportes', '["sales.read", "sales.write", "purchases.read", "purchases.write"]', 7),
('Vendedor', 'Módulo de ventas y clientes', '["sales.read", "sales.write", "customers.read"]', 5)
ON CONFLICT (name) DO NOTHING;

-- 16. Empresa de ejemplo
INSERT INTO public.companies (
    ruc,
    legal_name,
    trade_name,    
    currency_code,
    valuation_method
) VALUES (
    '20600055519',
    'MI EMPRESA SAC',
    'MI EMPRESA',    
    'CLP',
    'PROMEDIO_MOVIL'
);

-- 17. Unidades de medida adicionales
INSERT INTO sunat.cat_03_unidades_medida (code, descripcion) VALUES
('ZZ', 'SERVICIO'),
('GLL', 'GALÓN'),
('TN', 'TONELADA'),
('H87', 'PIEZA')
ON CONFLICT (code) DO NOTHING;

-- 18. Tipos de existencia (tab_05_tipo_existencia)
INSERT INTO sunat.tab_05_tipo_existencia (code, descripcion) VALUES
('01', 'MERCANCIAS'),
('02', 'PRODUCTOS TERMINADOS'),
('03', 'MATERIAS PRIMAS')
ON CONFLICT (code) DO NOTHING;

-- 🔹 USD ↔ PEN (ejemplo: 1 USD = 3.85 PEN)
INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('USD','PEN', 3.850000, '2025-09-07'),
('PEN','USD', 1/3.850000, '2025-09-07');

-- 🔹 USD ↔ CLP (ejemplo: 1 USD = 900 CLP)
INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('USD','CLP', 900.000000, '2025-09-07'),
('CLP','USD', 1/900.000000, '2025-09-07');

-- 🔹 PEN ↔ CLP (ejemplo: 1 PEN = 234 CLP)
INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('PEN','CLP', 234.000000, '2025-09-07'),
('CLP','PEN', 1/234.000000, '2025-09-07');

INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('USD','PEN', 3.850000, '2025-09-09'),
('PEN','USD', 1/3.850000, '2025-09-09');

-- 🔹 USD ↔ CLP (ejemplo: 1 USD = 900 CLP)
INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('USD','CLP', 900.000000, '2025-09-09'),
('CLP','USD', 1/900.000000, '2025-09-09');

-- 🔹 PEN ↔ CLP (ejemplo: 1 PEN = 234 CLP)
INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, rate_date)
VALUES 
('PEN','CLP', 234.000000, '2025-09-09'),
('CLP','PEN', 1/234.000000, '2025-09-09');

INSERT INTO cat_additional_costs (code, description) VALUES ('FLETE', 'Flete'), ('SEGU', 'Seguro'), ('ARAN', 'Aranceles');

-- 1. Sucursales (Lima, Ate, Callao)
INSERT INTO public.branches (company_id, code, name, address, ubigeo_code) 
SELECT id, '001', 'Casa Matriz', 'Av. Arequipa 123', '150101'
FROM public.companies WHERE ruc = '20600055519'
ON CONFLICT DO NOTHING;

INSERT INTO public.branches (company_id, code, name, address, ubigeo_code) 
SELECT id, '002', 'Sucursal Ate', 'Av. Nicolás Ayllón 2345', '150103'
FROM public.companies WHERE ruc = '20600055519'
ON CONFLICT DO NOTHING;

INSERT INTO public.branches (company_id, code, name, address, ubigeo_code) 
SELECT id, '003', 'Sucursal Callao', 'Av. Saenz Peña 345', '070101'
FROM public.companies WHERE ruc = '20600055519'
ON CONFLICT DO NOTHING;

-- 2. Almacenes
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
branch AS (SELECT id FROM public.branches WHERE code = '001' AND company_id = (SELECT id FROM company))
INSERT INTO public.warehouses (company_id, branch_id, code, name, width, height, length, address)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM branch),
  'ALM001',
  'Almacén Principal',
  20, 5, 30,
  'Av. Arequipa 123, Lima'
ON CONFLICT DO NOTHING;

WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
branch AS (SELECT id FROM public.branches WHERE code = '002' AND company_id = (SELECT id FROM company))
INSERT INTO public.warehouses (company_id, branch_id, code, name, width, height, length, address, is_active)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM branch),
  'ALM002',
  'Almacén Ate',
  15, 4, 25,
  'Av. Nicolás Ayllón 2345, Ate',
  FALSE
ON CONFLICT DO NOTHING;

-- 3. Zonas de almacén
WITH warehouse AS (
  SELECT id FROM public.warehouses WHERE code = 'ALM001' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.warehouse_zones (company_id, warehouse_id, code, name, width, height, length)
SELECT 
  (SELECT id FROM public.companies WHERE ruc = '20600055519'),
  (SELECT id FROM warehouse),
  'ZONA-A',
  'Zona de Alimentos',
  10, 4, 8
ON CONFLICT DO NOTHING;

-- 4. Marcas
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.brands (company_id, name, code)
SELECT id, 'Gloria', 'GLORIA' FROM company
UNION ALL
SELECT id, 'Alicorp', 'ALICORP' FROM company
UNION ALL
SELECT id, 'Nestlé', 'NESTLE' FROM company
UNION ALL
SELECT id, 'Backus', 'BACKUS' FROM company
UNION ALL
SELECT id, 'Laive', 'LAIVE' FROM company
ON CONFLICT DO NOTHING;

-- 5. Categorías
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.categories (company_id, name, code)
SELECT id, 'Lácteos', 'LACTEOS' FROM company
UNION ALL
SELECT id, 'Abarrotes', 'ABARROTES' FROM company
UNION ALL
SELECT id, 'Bebidas', 'BEBIDAS' FROM company
UNION ALL
SELECT id, 'Limpieza', 'LIMPIEZA' FROM company
ON CONFLICT DO NOTHING;

-- 6. Productos
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
lacteos AS (SELECT id FROM public.categories WHERE code = 'LACTEOS' AND company_id = (SELECT id FROM company)),
gloria AS (SELECT id FROM public.brands WHERE code = 'GLORIA' AND company_id = (SELECT id FROM company)),
alicorp AS (SELECT id FROM public.brands WHERE code = 'ALICORP' AND company_id = (SELECT id FROM company))
INSERT INTO public.products (company_id, sku, barcode, name, description, brand_id, category_id, unit_code, tipo_afectacion, weight_kg)
SELECT 
  (SELECT id FROM company),
  'LECHE-GLORIA-1L',
  '7751850006017',
  'Leche Gloria Entera 1L',
  'Leche entera en caja 1L',
  (SELECT id FROM gloria),
  (SELECT id FROM lacteos),
  'LTR',
  '10',
  1.03
UNION ALL
SELECT 
  (SELECT id FROM company),
  'ACEITE-PRIMOR-1L',
  '7750245000014',
  'Aceite Primor 1L',
  'Aceite vegetal Primor 1L',
  (SELECT id FROM alicorp),
  (SELECT id FROM public.categories WHERE code = 'ABARROTES' AND company_id = (SELECT id FROM company)),
  'LTR',
  '10',
  0.92
ON CONFLICT DO NOTHING;

-- 7. Proveedores
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.parties (company_id, is_supplier, doc_type, doc_number, razon_social)
SELECT id, true, '6', '20100066671', 'GLORIA S.A.' FROM company
UNION ALL
SELECT id, true, '6', '20100055519', 'ALICORP S.A.A.' FROM company
ON CONFLICT DO NOTHING;

-- 8. Clientes
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.parties (company_id, is_customer, doc_type, doc_number, nombres, razon_social)
SELECT id, true, '6', '20100033345', null, 'PLAZA VEA S.A.' FROM company
UNION ALL
SELECT id, true, '6', '20100022278', null, 'TOTTUS S.A.' FROM company
UNION ALL
SELECT id, true, '1', '45879632', 'JUAN PEREZ', null FROM company
ON CONFLICT DO NOTHING;

-- 9. Órdenes de Compra
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
supplier AS (SELECT id FROM public.parties WHERE doc_number = '20100066671' AND company_id = (SELECT id FROM company)),
branch AS (SELECT id FROM public.branches WHERE code = '001' AND company_id = (SELECT id FROM company))
INSERT INTO public.purchase_orders (company_id, branch_id, supplier_id, order_date, currency_code, total_amount)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM branch),
  (SELECT id FROM supplier),
  CURRENT_DATE - INTERVAL '5 days',
  'PEN',
  2500.00
ON CONFLICT DO NOTHING;

-- 10. Items de Orden de Compra
WITH 
po AS (
  SELECT id FROM public.purchase_orders 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.purchase_order_items (purchase_order_id, product_id, unit_code, quantity, unit_price)
SELECT 
  (SELECT id FROM po),
  (SELECT id FROM product),
  'LTR',
  100,
  12.50
ON CONFLICT DO NOTHING;

-- 11. Documentos de Compra
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
supplier AS (SELECT id FROM public.parties WHERE doc_number = '20100066671' AND company_id = (SELECT id FROM company))
INSERT INTO public.purchase_docs (company_id, supplier_id, doc_type, series, number, issue_date, arrival_date, currency_code, total, exchange_rate, op_type_kardex, total_ope_gravadas, total_igv)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM supplier),
  '01',
  'F001',
  '12345',
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE - INTERVAL '2 days',
  'PEN',
  1475.00,
  1,
  '02',
  1250.00,
  125.00
  
ON CONFLICT DO NOTHING;

-- 12. Items de Documento de Compra
WITH 
pd AS (
  SELECT id FROM public.purchase_docs 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.purchase_doc_items (company_id, purchase_doc_id, product_id, unit_code, quantity, unit_cost, total_line)
SELECT 
  (SELECT id FROM public.companies WHERE ruc = '20600055519'),
  (SELECT id FROM pd),
  (SELECT id FROM product),
  'LTR',
  100,
  12.50,
  1250.00
ON CONFLICT DO NOTHING;

-- 13. Recepciones
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
warehouse AS (SELECT id FROM public.warehouses WHERE code = 'ALM001' AND company_id = (SELECT id FROM company)),
purchase_doc AS (
  SELECT id FROM public.purchase_docs 
  WHERE company_id = (SELECT id FROM company)
  ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.receptions (company_id, warehouse_id, purchase_doc_id, reception_date,status) 
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM warehouse),
  (SELECT id FROM purchase_doc),
  CURRENT_DATE - INTERVAL '1 day',
  'COMPLETE'
ON CONFLICT DO NOTHING;


-- 14. Items de Recepción
WITH 
reception AS (
  SELECT id FROM public.receptions 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.reception_items (reception_id, product_id, quantity_received, unit_cost)
SELECT 
  (SELECT id FROM reception),
  (SELECT id FROM product),
  100,
  12.50
ON CONFLICT DO NOTHING;


-- 15. Órdenes de Venta
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
customer AS (SELECT id FROM public.parties WHERE doc_number = '20100033345' AND company_id = (SELECT id FROM company)),
branch AS (SELECT id FROM public.branches WHERE code = '001' AND company_id = (SELECT id FROM company))
INSERT INTO public.sales_orders (company_id, branch_id, customer_id, order_date, currency_code, total_amount)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM branch),
  (SELECT id FROM customer),
  CURRENT_DATE,
  'PEN',
  1500.00
ON CONFLICT DO NOTHING;

-- 16. Items de Orden de Venta
WITH 
so AS (
  SELECT id FROM public.sales_orders 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.sales_order_items (sales_order_id, product_id, quantity, unit_price)
SELECT 
  (SELECT id FROM so),
  (SELECT id FROM product),
  50,
  15.00
ON CONFLICT DO NOTHING;

-- 17. Documentos de Venta
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
customer AS (SELECT id FROM public.parties WHERE doc_number = '20100033345' AND company_id = (SELECT id FROM company)),
branch AS (SELECT id FROM public.branches WHERE code = '001' AND company_id = (SELECT id FROM company))
INSERT INTO public.sales_docs (company_id, branch_id, customer_id, doc_type, series, number, issue_date, currency_code, total)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM branch),
  (SELECT id FROM customer),
  '01',
  'F001',
  '00000001',
  CURRENT_DATE,
  'PEN',
  885.00
ON CONFLICT DO NOTHING;

-- 18. Items de Documento de Venta
WITH 
sd AS (
  SELECT id FROM public.sales_docs 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.sales_doc_items (company_id, sales_doc_id, product_id, unit_code, quantity, unit_price, total_line)
SELECT 
  (SELECT id FROM public.companies WHERE ruc = '20600055519'),
  (SELECT id FROM sd),
  (SELECT id FROM product),
  'LTR',
  50,
  15.00,
  750.00
ON CONFLICT DO NOTHING;

-- 19. Envíos
WITH 
company AS (SELECT id FROM public.companies WHERE ruc = '20600055519'),
warehouse AS (SELECT id FROM public.warehouses WHERE code = 'ALM001' AND company_id = (SELECT id FROM company)),
sales_doc AS (
  SELECT id FROM public.sales_docs 
  WHERE company_id = (SELECT id FROM company)
  ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.shipments (company_id, warehouse_id, sales_doc_id, shipment_date,status)
SELECT 
  (SELECT id FROM company),
  (SELECT id FROM warehouse),
  (SELECT id FROM sales_doc),
  CURRENT_DATE,
  'COMPLETE'
ON CONFLICT DO NOTHING;

-- 20. Items de Envío
WITH 
shipment AS (
  SELECT id FROM public.shipments 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.shipment_items (shipment_id, product_id, quantity_shipped)
SELECT 
  (SELECT id FROM shipment),
  (SELECT id FROM product),
  50
ON CONFLICT DO NOTHING;


-- 21. Listas de Precios
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.price_lists (company_id, name, currency_code, is_default)
SELECT id, 'Lista General', 'PEN', true FROM company
ON CONFLICT DO NOTHING;

-- 22. Items de Lista de Precios
WITH 
pl AS (
  SELECT id FROM public.price_lists 
  WHERE company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
  ORDER BY created_at DESC LIMIT 1
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.price_list_items (company_id, price_list_id, product_id, unit_price, valid_from)
SELECT 
  (SELECT id FROM public.companies WHERE ruc = '20600055519'),
  (SELECT id FROM pl),
  (SELECT id FROM product),
  15.00,
  CURRENT_DATE
ON CONFLICT DO NOTHING;

-- 23. Series Documentales
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.document_series (company_id, document_type_code, series, is_active)
SELECT id, '01', 'F001', true FROM company
UNION ALL
SELECT id, '03', 'B001', true FROM company
UNION ALL
SELECT id, '07', 'FC01', true FROM company
ON CONFLICT DO NOTHING;

-- 24. Contadores de Documentos
WITH company AS (SELECT id FROM public.companies WHERE ruc = '20600055519')
INSERT INTO public.document_counters (company_id, document_type_code, series, last_number)
SELECT id, '01', 'F001', 1 FROM company
UNION ALL
SELECT id, '03', 'B001', 0 FROM company
UNION ALL
SELECT id, '07', 'FC01', 0 FROM company
ON CONFLICT DO NOTHING;

-- 25. Stock inicial
WITH 
warehouse AS (
  SELECT id FROM public.warehouses 
  WHERE code = 'ALM001' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
),
product AS (
  SELECT id FROM public.products 
  WHERE sku = 'LECHE-GLORIA-1L' 
  AND company_id = (SELECT id FROM public.companies WHERE ruc = '20600055519')
)
INSERT INTO public.warehouse_stock (warehouse_id, product_id, balance_qty)
SELECT 
  (SELECT id FROM warehouse),
  (SELECT id FROM product),
  100
ON CONFLICT DO NOTHING;

-- CURRENT V_CURRENT_STOCK Y V_INVENTORY_VALUATION  NO REALIZAN EL TRIGUERS DESDE LA TABLA RECEPTION O SHIPMENT