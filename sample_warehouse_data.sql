-- ============================================================================
-- DATOS DE EJEMPLO PARA PROBAR VISUALIZADOR DE ALMACENES
-- ============================================================================
-- Este archivo contiene datos de ejemplo para probar las vistas 2D y 3D
-- con la nueva estructura jerárquica: Almacén → Zona → Pasillo → Estante → Posición
-- ============================================================================

-- NOTA: Reemplaza 'YOUR_COMPANY_ID' con tu ID de empresa real antes de ejecutar

-- 1. CREAR ALMACÉN DE EJEMPLO
INSERT INTO warehouses (
    id, company_id, code, name,
    width, height, length,
    warehouse_type, temperature_zone, max_capacity_kg,
    is_active, operational_status,
    created_at, updated_at
) VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'ALM001',
    'Almacén Central Norte',
    50, 8, 40,
    'GENERAL', 'AMBIENT', 100000,
    true, 'OPERATIONAL',
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 2. CREAR ZONAS DEL ALMACÉN
INSERT INTO warehouse_zones (
    id, company_id, warehouse_id, code, name,
    width, height, length, capacity_kg,
    x_coordinate, y_coordinate, z_coordinate,
    shape_type, color_hex, opacity,
    created_at, updated_at
) VALUES
-- Zona A - Productos Pesados
(
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'ZA', 'Zona A - Productos Pesados',
    20, 8, 15, 30000,
    5, 5, 0,
    'RECTANGLE', '#3b82f6', 0.3,
    now(), now()
),
-- Zona B - Productos Livianos
(
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'ZB', 'Zona B - Productos Livianos',
    20, 8, 15, 20000,
    25, 5, 0,
    'RECTANGLE', '#10b981', 0.3,
    now(), now()
),
-- Zona C - Productos Especiales
(
    'dddddddd-eeee-ffff-0000-111111111111'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'ZC', 'Zona C - Productos Especiales',
    15, 8, 10, 10000,
    5, 25, 0,
    'RECTANGLE', '#f59e0b', 0.3,
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 3. CREAR PASILLOS EN LAS ZONAS
INSERT INTO warehouse_aisles (
    id, company_id, warehouse_zone_id, code, name,
    start_x, start_y, end_x, end_y, width,
    is_main_aisle, direction,
    created_at, updated_at
) VALUES
-- Pasillos en Zona A
(
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'A1', 'Pasillo A1',
    7, 7, 7, 18, 2,
    true, 'VERTICAL',
    now(), now()
),
(
    'ffffffff-0000-1111-2222-333333333333'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'A2', 'Pasillo A2',
    13, 7, 13, 18, 2,
    false, 'VERTICAL',
    now(), now()
),
(
    '00000000-1111-2222-3333-444444444444'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'A3', 'Pasillo A3',
    19, 7, 19, 18, 2,
    false, 'VERTICAL',
    now(), now()
),
-- Pasillos en Zona B
(
    '11111111-2222-3333-4444-555555555555'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'B1', 'Pasillo B1',
    27, 7, 27, 18, 2,
    true, 'VERTICAL',
    now(), now()
),
(
    '22222222-3333-4444-5555-666666666666'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'B2', 'Pasillo B2',
    35, 7, 35, 18, 2,
    false, 'VERTICAL',
    now(), now()
),
-- Pasillo en Zona C
(
    '33333333-4444-5555-6666-777777777777'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'dddddddd-eeee-ffff-0000-111111111111'::uuid,
    'C1', 'Pasillo C1',
    7, 27, 18, 27, 2,
    true, 'HORIZONTAL',
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 4. CREAR ESTANTES EN LOS PASILLOS
INSERT INTO warehouse_shelves (
    id, company_id, warehouse_aisle_id, code, name,
    position_x, position_y, position_z,
    width, depth, height, levels, level_height,
    max_weight_kg, load_capacity_per_level,
    shelf_type, material, is_active,
    created_at, updated_at
) VALUES
-- Estantes en Pasillo A1
(
    '44444444-5555-6666-7777-888888888888'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    '01', 'Estante A1-01',
    8, 8, 0,
    1.2, 0.6, 2.5, 4, 0.6,
    2000, 500,
    'STANDARD', 'STEEL', true,
    now(), now()
),
(
    '55555555-6666-7777-8888-999999999999'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    '02', 'Estante A1-02',
    8, 10, 0,
    1.2, 0.6, 2.5, 4, 0.6,
    2000, 500,
    'STANDARD', 'STEEL', true,
    now(), now()
),
(
    '66666666-7777-8888-9999-aaaaaaaaaaaa'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    '03', 'Estante A1-03',
    8, 12, 0,
    1.2, 0.6, 2.5, 4, 0.6,
    2000, 500,
    'STANDARD', 'STEEL', true,
    now(), now()
),
-- Estantes en Pasillo B1
(
    '77777777-8888-9999-aaaa-bbbbbbbbbbbb'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '11111111-2222-3333-4444-555555555555'::uuid,
    '01', 'Estante B1-01',
    28, 8, 0,
    1.2, 0.6, 2.0, 3, 0.6,
    1500, 500,
    'STANDARD', 'STEEL', true,
    now(), now()
),
(
    '88888888-9999-aaaa-bbbb-cccccccccccc'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '11111111-2222-3333-4444-555555555555'::uuid,
    '02', 'Estante B1-02',
    28, 10, 0,
    1.2, 0.6, 2.0, 3, 0.6,
    1500, 500,
    'STANDARD', 'STEEL', true,
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 5. CREAR POSICIONES EN LOS ESTANTES
-- Posiciones para Estante A1-01
INSERT INTO warehouse_shelf_positions (
    id, company_id, warehouse_shelf_id,
    level_number, position_number,
    width, depth, height,
    max_weight_kg, max_volume_m3,
    is_reserved, is_active, condition,
    created_at, updated_at
) VALUES
-- Nivel 1
(
    '99999999-aaaa-bbbb-cccc-dddddddddddd'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '44444444-5555-6666-7777-888888888888'::uuid,
    1, 1,
    0.4, 0.6, 0.6,
    125, 0.144,
    false, true, 'GOOD',
    now(), now()
),
(
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '44444444-5555-6666-7777-888888888888'::uuid,
    1, 2,
    0.4, 0.6, 0.6,
    125, 0.144,
    false, true, 'GOOD',
    now(), now()
),
(
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '44444444-5555-6666-7777-888888888888'::uuid,
    1, 3,
    0.4, 0.6, 0.6,
    125, 0.144,
    false, true, 'EXCELLENT',
    now(), now()
),
-- Nivel 2
(
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '44444444-5555-6666-7777-888888888888'::uuid,
    2, 1,
    0.4, 0.6, 0.6,
    125, 0.144,
    false, true, 'GOOD',
    now(), now()
),
(
    'dddddddd-eeee-ffff-0000-111111111111'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '44444444-5555-6666-7777-888888888888'::uuid,
    2, 2,
    0.4, 0.6, 0.6,
    125, 0.144,
    true, true, 'GOOD',
    now(), now()
),
-- Posiciones para Estante B1-01
(
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '77777777-8888-9999-aaaa-bbbbbbbbbbbb'::uuid,
    1, 1,
    0.4, 0.6, 0.6,
    167, 0.144,
    false, true, 'EXCELLENT',
    now(), now()
),
(
    'ffffffff-0000-1111-2222-333333333333'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    '77777777-8888-9999-aaaa-bbbbbbbbbbbb'::uuid,
    1, 2,
    0.4, 0.6, 0.6,
    167, 0.144,
    false, true, 'GOOD',
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 6. CREAR ALGUNOS PRODUCTOS DE EJEMPLO (si no existen)
-- NOTA: Esto requiere que existan brands y categories, ajusta según tu estructura
/*
INSERT INTO products (
    id, company_id, sku, name, description,
    brand_id, category_id, unit_code, tipo_afectacion,
    width, height, length, weight_kg,
    min_stock, max_stock, reorder_point,
    active, created_at, updated_at
) VALUES
(
    'prod0001-0000-0000-0000-000000000001'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'PROD001', 'Producto de Ejemplo 1', 'Descripción del producto 1',
    (SELECT id FROM brands WHERE company_id = 'YOUR_COMPANY_ID'::uuid LIMIT 1),
    (SELECT id FROM categories WHERE company_id = 'YOUR_COMPANY_ID'::uuid LIMIT 1),
    'NIU', '10',
    0.3, 0.2, 0.4, 2.5,
    10, 500, 50,
    true, now(), now()
),
(
    'prod0002-0000-0000-0000-000000000002'::uuid,
    'YOUR_COMPANY_ID'::uuid,
    'PROD002', 'Producto de Ejemplo 2', 'Descripción del producto 2',
    (SELECT id FROM brands WHERE company_id = 'YOUR_COMPANY_ID'::uuid LIMIT 1),
    (SELECT id FROM categories WHERE company_id = 'YOUR_COMPANY_ID'::uuid LIMIT 1),
    'NIU', '10',
    0.4, 0.3, 0.5, 1.8,
    5, 200, 25,
    true, now(), now()
) ON CONFLICT (id) DO NOTHING;
*/

-- 7. CREAR UBICACIONES DE PRODUCTOS
INSERT INTO product_location (
    id, product_id, warehouse_zone_id, warehouse_shelf_position_id,
    position_x, position_y, position_z,
    capacity_max, stock_actual, es_principal, estado,
    created_at, updated_at
) VALUES
-- Producto 1 en diferentes ubicaciones
(
    'loc00001-0000-0000-0000-000000000001'::uuid,
    'prod0001-0000-0000-0000-000000000001'::uuid,
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    '99999999-aaaa-bbbb-cccc-dddddddddddd'::uuid,
    8.2, 8.3, 0.3,
    100, 75, true, true,
    now(), now()
),
(
    'loc00002-0000-0000-0000-000000000002'::uuid,
    'prod0001-0000-0000-0000-000000000001'::uuid,
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'::uuid,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    8.6, 8.3, 0.3,
    100, 45, false, true,
    now(), now()
),
-- Producto 2 en ubicaciones diferentes
(
    'loc00003-0000-0000-0000-000000000003'::uuid,
    'prod0002-0000-0000-0000-000000000002'::uuid,
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'eeeeeeee-ffff-0000-1111-222222222222'::uuid,
    28.2, 8.3, 0.3,
    80, 60, true, true,
    now(), now()
),
(
    'loc00004-0000-0000-0000-000000000004'::uuid,
    'prod0002-0000-0000-0000-000000000002'::uuid,
    'cccccccc-dddd-eeee-ffff-000000000000'::uuid,
    'ffffffff-0000-1111-2222-333333333333'::uuid,
    28.6, 8.3, 0.3,
    80, 30, false, true,
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSTRUCCIONES PARA USO:
-- ============================================================================
-- 1. Reemplaza 'YOUR_COMPANY_ID' con tu ID de empresa real
-- 2. Si no tienes productos, descomenta y ajusta la sección de productos
-- 3. Ejecuta este script en tu base de datos Supabase
-- 4. Prueba el visualizador navegando a /warehouse/visualizer
-- ============================================================================

-- Ejemplo de consulta para verificar los datos:
-- SELECT * FROM v_product_locations_detailed
-- WHERE warehouse_name = 'Almacén Central Norte';