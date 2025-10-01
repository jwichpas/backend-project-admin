-- Agregar user_id a whatsapp_contacts para RLS
ALTER TABLE whatsapp_contacts
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para user_id
CREATE INDEX idx_whatsapp_contacts_user_id ON whatsapp_contacts(user_id);

-- Eliminar constraint UNIQUE de phone_number (ahora debe ser único por usuario)
ALTER TABLE whatsapp_contacts DROP CONSTRAINT IF EXISTS whatsapp_contacts_phone_number_key;

-- Crear constraint único compuesto (user_id + phone_number)
ALTER TABLE whatsapp_contacts
ADD CONSTRAINT whatsapp_contacts_user_phone_unique UNIQUE (user_id, phone_number);

-- Actualizar la función de trigger para incluir user_id
CREATE OR REPLACE FUNCTION update_contact_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO whatsapp_contacts (user_id, phone_number, contact_name, last_message_at, message_count)
  VALUES (NEW.user_id, NEW.phone_number, NEW.contact_name, NEW.timestamp, 1)
  ON CONFLICT (user_id, phone_number)
  DO UPDATE SET
    contact_name = COALESCE(EXCLUDED.contact_name, whatsapp_contacts.contact_name),
    last_message_at = EXCLUDED.last_message_at,
    message_count = whatsapp_contacts.message_count + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_contacts
CREATE POLICY "Users can view their own contacts"
  ON whatsapp_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON whatsapp_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON whatsapp_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON whatsapp_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Comentario
COMMENT ON COLUMN whatsapp_contacts.user_id IS 'ID del usuario propietario del contacto';
