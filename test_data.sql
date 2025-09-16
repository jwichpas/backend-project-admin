-- ============================================================================
-- DATOS DE PRUEBA PARA VISTAS 2D Y 3D DE UBICACIONES
-- ============================================================================
-- Este script crea datos de prueba básicos para probar inmediatamente
-- las vistas 2D y 3D sin modificar la estructura de base de datos
-- ============================================================================

-- PASO 1: Identificar tus IDs existentes
-- ============================================================================
-- Ejecuta estas consultas primero para obtener tus IDs:

-- Ver tus empresas:
-- SELECT id, legal_name FROM companies;

-- Ver tus almacenes:  
-- SELECT id, name, company_id FROM warehouses;

-- Ver tus productos:
-- SELECT id, name, sku, company_id FROM products LIMIT 5;

-- PASO 2: CREAR DATOS DE EJEMPLO (Reemplaza los IDs)
-- ============================================================================

-- Variables que debes reemplazar con tus valores reales:
-- COMPANY_ID: e4c9ac95-98be-4ee7-8c82-3a19d4ae4e9f (el que aparece en tus logs)
-- WAREHOUSE_ID: ID del "Almacén Principal" que tiene datos
-- PRODUCT_IDS: IDs de productos existentes en tu BD

-- INSERTAR MÁS UBICACIONES DE PRODUCTOS (Reemplaza los UUIDs)
INSERT INTO product_location (product_id, warehouse_zone_id, position_x, position_y, position_z, capacity_max, stock_actual, es_principal, estado) 
VALUES 
    -- Productos distribuidos por el almacén
    ('REPLACE_WITH_PRODUCT_ID_1'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, 5.0, 8.0, 0.5, 100, 25, false, true),
    ('REPLACE_WITH_PRODUCT_ID_2'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, 12.0, 15.0, 1.0, 150, 80, true, true),
    ('REPLACE_WITH_PRODUCT_ID_3'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, 3.5, 22.0, 0.0, 75, 12, false, true),
    ('REPLACE_WITH_PRODUCT_ID_4'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, 18.0, 5.0, 2.0, 200, 150, false, true),
    ('REPLACE_WITH_PRODUCT_ID_5'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, 8.5, 18.5, 1.5, 90, 45, false, true),
    
    -- Productos sin coordenadas específicas (se auto-posicionarán)
    ('REPLACE_WITH_PRODUCT_ID_6'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, NULL, NULL, NULL, 120, 65, false, true),
    ('REPLACE_WITH_PRODUCT_ID_7'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, NULL, NULL, NULL, 80, 30, false, true),
    ('REPLACE_WITH_PRODUCT_ID_8'::UUID, 'REPLACE_WITH_ZONE_ID'::UUID, NULL, NULL, NULL, 160, 95, true, true);

-- EJEMPLO CONCRETO CON TUS DATOS REALES:
-- Basándome en tus logs, aquí tienes un ejemplo más específico:

/*
-- Obtén primero los IDs reales ejecutando:
SELECT 
    c.id as company_id,
    w.id as warehouse_id,
    w.name as warehouse_name,
    wz.id as zone_id,
    wz.name as zone_name
FROM companies c
JOIN warehouses w ON w.company_id = c.id
LEFT JOIN warehouse_zones wz ON wz.warehouse_id = w.id
WHERE c.legal_name = 'MI EMPRESA SAC';

-- También obtén algunos productos:
SELECT id, name, sku 
FROM products 
WHERE company_id = 'e4c9ac95-98be-4ee7-8c82-3a19d4ae4e9f'::UUID
LIMIT 10;

-- Luego usa esos IDs para crear ubicaciones:
INSERT INTO product_location (product_id, warehouse_zone_id, position_x, position_y, position_z, capacity_max, stock_actual, es_principal, estado) 
VALUES 
    ('TU_PRODUCT_ID_1'::UUID, 'TU_ZONE_ID'::UUID, 2.5, 5.0, 0.0, 50, 15, true, true),
    ('TU_PRODUCT_ID_2'::UUID, 'TU_ZONE_ID'::UUID, 8.0, 12.5, 1.0, 75, 32, false, true),
    ('TU_PRODUCT_ID_3'::UUID, 'TU_ZONE_ID'::UUID, 15.5, 20.0, 0.5, 100, 67, false, true),
    ('TU_PRODUCT_ID_4'::UUID, 'TU_ZONE_ID'::UUID, 6.0, 8.5, 2.0, 40, 8, false, true),
    ('TU_PRODUCT_ID_5'::UUID, 'TU_ZONE_ID'::UUID, 11.5, 16.0, 1.5, 90, 45, false, true);
*/

-- ============================================================================
-- SCRIPT AUTOMÁTICO PARA CREAR DATOS DE EJEMPLO
-- ============================================================================
-- Este script creará automáticamente ubicaciones para tus productos existentes

DO $$
DECLARE
    company_uuid UUID := 'e4c9ac95-98be-4ee7-8c82-3a19d4ae4e9f'; -- Reemplaza con tu company ID
    warehouse_uuid UUID;
    zone_uuid UUID;
    product_record RECORD;
    counter INTEGER := 0;
    x_pos NUMERIC;
    y_pos NUMERIC;
    z_pos NUMERIC;
BEGIN
    -- Encontrar el almacén principal con zonas
    SELECT w.id INTO warehouse_uuid
    FROM warehouses w
    JOIN warehouse_zones wz ON wz.warehouse_id = w.id
    WHERE w.company_id = company_uuid
    AND w.name ILIKE '%principal%'
    LIMIT 1;
    
    -- Si no encuentra "principal", usar el primer almacén con zonas
    IF warehouse_uuid IS NULL THEN
        SELECT w.id INTO warehouse_uuid
        FROM warehouses w
        JOIN warehouse_zones wz ON wz.warehouse_id = w.id
        WHERE w.company_id = company_uuid
        LIMIT 1;
    END IF;
    
    -- Obtener la primera zona de ese almacén
    SELECT id INTO zone_uuid
    FROM warehouse_zones
    WHERE warehouse_id = warehouse_uuid
    LIMIT 1;
    
    RAISE NOTICE 'Using warehouse: %, zone: %', warehouse_uuid, zone_uuid;
    
    -- Si encontramos warehouse y zona, crear ubicaciones
    IF warehouse_uuid IS NOT NULL AND zone_uuid IS NOT NULL THEN
        -- Crear ubicaciones para productos existentes
        FOR product_record IN 
            SELECT id, name 
            FROM products 
            WHERE company_id = company_uuid
            AND active = true
            AND id NOT IN (SELECT product_id FROM product_location WHERE estado = true)
            LIMIT 8
        LOOP
            counter := counter + 1;
            
            -- Calcular posiciones en una grilla
            x_pos := (counter % 4) * 5.0 + 2.0;  -- 4 columnas
            y_pos := (counter / 4) * 6.0 + 3.0;  -- Espacio entre filas
            z_pos := (counter % 3) * 0.8;        -- 3 niveles de altura
            
            RAISE NOTICE 'Creating location for product: % at position (%, %, %)', 
                product_record.name, x_pos, y_pos, z_pos;
            
            INSERT INTO product_location (
                product_id, 
                warehouse_zone_id, 
                position_x, 
                position_y, 
                position_z, 
                capacity_max, 
                stock_actual, 
                es_principal, 
                estado
            ) VALUES (
                product_record.id,
                zone_uuid,
                x_pos,
                y_pos,
                z_pos,
                50 + (counter * 10), -- Capacidad variable
                10 + (counter * 5),  -- Stock variable
                counter = 1,         -- Solo el primero es principal
                true
            );
        END LOOP;
        
        RAISE NOTICE 'Created % product locations', counter;
    ELSE
        RAISE NOTICE 'No suitable warehouse or zone found for company %', company_uuid;
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN DE DATOS CREADOS
-- ============================================================================

-- Ver las ubicaciones creadas
SELECT 
    pl.id,
    p.name as product_name,
    p.sku,
    wz.name as zone_name,
    pl.position_x,
    pl.position_y,
    pl.position_z,
    pl.stock_actual,
    pl.capacity_max,
    pl.es_principal
FROM product_location pl
JOIN products p ON p.id = pl.product_id
JOIN warehouse_zones wz ON wz.id = pl.warehouse_zone_id
WHERE pl.estado = true
ORDER BY pl.created_at DESC;

-- Ver estadísticas por almacén
SELECT 
    w.name as warehouse_name,
    COUNT(pl.id) as total_locations,
    SUM(pl.stock_actual) as total_stock,
    AVG(pl.capacity_max) as avg_capacity
FROM warehouses w
LEFT JOIN warehouse_zones wz ON wz.warehouse_id = w.id
LEFT JOIN product_location pl ON pl.warehouse_zone_id = wz.id AND pl.estado = true
GROUP BY w.id, w.name
ORDER BY total_locations DESC;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================

/*
PASOS PARA USAR ESTE SCRIPT:

1. IDENTIFICAR TUS IDs:
   - Ejecuta: SELECT id, legal_name FROM companies;
   - Copia tu company_id y reemplázalo en la variable company_uuid

2. EJECUTAR EL SCRIPT:
   - Ejecuta todo este script en tu Supabase SQL Editor
   - El script creará automáticamente 8 ubicaciones de productos

3. VERIFICAR EN LA APLICACIÓN:
   - Ve a /products/locations
   - Cambia a vista 2D o 3D
   - Deberías ver los productos distribuidos en el almacén

4. PERSONALIZAR (OPCIONAL):
   - Modifica las posiciones x_pos, y_pos, z_pos para cambiar la distribución
   - Cambia el LIMIT en el loop para crear más o menos ubicaciones
   - Ajusta capacity_max y stock_actual según tus necesidades

¡Después de ejecutar este script, las vistas 2D y 3D deberían mostrar tus productos inmediatamente!
*/