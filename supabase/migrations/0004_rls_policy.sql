-- ============================================================================
-- POLÍTICAS RLS BÁSICAS Y HABILITACIÓN DE TIEMPO REAL
-- ============================================================================

-- 1. Habilitar RLS en todas las tablas principales
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_purchase_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_realtime_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_position_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_doc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_doc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;


-- 2. Política básica para todas las tablas: Solo usuarios autenticados pueden acceder
CREATE POLICY "Solo usuarios autenticados pueden ver datos" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden insertar datos" ON public.roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden actualizar datos" ON public.roles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden eliminar datos" ON public.roles FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden ver datos" ON public.companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden insertar datos" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden actualizar datos" ON public.companies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo usuarios autenticados pueden eliminar datos" ON public.companies FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.branches as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.warehouses as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.warehouse_zones as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.parties as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.party_locations as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.party_contacts as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.brands as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.categories as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.products as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_images as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_codes as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_attributes as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_attribute_values as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_purchase_prices as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_price_history as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_location as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_batches as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.product_serials as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.price_lists as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.price_list_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.discounts as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.discount_products as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.discount_categories as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.vehicles as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.vehicle_realtime_status as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.vehicle_position_logs as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.drivers as PERMISSIVE FOR ALL to authenticated USING (true);

CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.vehicle_drivers as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.purchase_orders as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.purchase_order_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.purchase_docs as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.purchase_doc_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.receptions as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.reception_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.sales_orders as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.sales_order_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.sales_docs as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.shipments as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.shipment_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.document_series as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.document_counters as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.stock_ledger as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.warehouse_stock as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.stock_transfers as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.stock_transfer_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.inventory_adjustments as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.inventory_adjustment_items as PERMISSIVE FOR ALL to authenticated USING (true);
CREATE POLICY "Solo usuarios autenticados pueden ver todos los datos" ON public.exchange_rates as PERMISSIVE FOR ALL to authenticated USING (true);





-- 3. Política específica para user_companies: Usuarios solo ven sus propias relaciones
CREATE POLICY "Usuarios solo ven sus propias relaciones con empresas"
ON public.user_companies
FOR ALL USING (auth.uid() = user_id);

-- 4. Habilitar tiempo real para tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_docs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_docs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_realtime_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_ledger;

