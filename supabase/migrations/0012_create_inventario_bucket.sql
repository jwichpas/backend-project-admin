-- Crear bucket para archivos de inventario (productos, imágenes, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventario', 'inventario', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para el bucket inventario

-- Policy: Los usuarios pueden ver archivos de su empresa
CREATE POLICY "Users can view files from their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inventario' AND
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND (storage.foldername(name))[1] LIKE 'products%'
  )
);

-- Policy: Los usuarios pueden subir archivos de productos
CREATE POLICY "Users can upload product files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inventario' AND
  (storage.foldername(name))[1] = 'products' AND
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);

-- Policy: Los usuarios pueden actualizar archivos de productos de su empresa
CREATE POLICY "Users can update product files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inventario' AND
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);

-- Policy: Los usuarios pueden eliminar archivos de productos de su empresa
CREATE POLICY "Users can delete product files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inventario' AND
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
  )
);
