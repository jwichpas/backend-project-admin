CREATE OR REPLACE FUNCTION log_vehicle_position()
RETURNS TRIGGER AS $$
DECLARE
  changed_position BOOLEAN := NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude;
  changed_speed BOOLEAN := NEW.speed_kph IS DISTINCT FROM OLD.speed_kph;
  changed_status BOOLEAN := NEW.status IS DISTINCT FROM OLD.status;
  change_type TEXT;
BEGIN
  -- Determinar el tipo de cambio
  IF changed_position AND changed_speed AND changed_status THEN
    change_type := 'multiple';
  ELSIF (changed_position AND changed_speed)
     OR (changed_position AND changed_status)
     OR (changed_speed AND changed_status) THEN
    change_type := 'multiple';
  ELSIF changed_position THEN
    change_type := 'position';
  ELSIF changed_speed THEN
    change_type := 'speed';
  ELSIF changed_status THEN
    change_type := 'status';
  ELSE
    RETURN NEW; -- No hubo cambio relevante, no insertar nada
  END IF;

  -- Insertar en vehicle_position_logs
  INSERT INTO vehicle_position_logs (
    vehicle_id,
    latitude,
    longitude,
    speed_kph,
    heading_deg,
    status,
    reported_at,
    created_at,
    change_type
  ) VALUES (
    NEW.vehicle_id,
    NEW.latitude,
    NEW.longitude,
    NEW.speed_kph,
    NEW.heading_deg,
    NEW.status,
    NEW.updated_at,
    NOW(),
    change_type
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER after_vehicle_realtime_update
AFTER UPDATE ON vehicle_realtime_status
FOR EACH ROW
EXECUTE FUNCTION log_vehicle_position();

-- Vista para obtener la última posición de cada vehículo

CREATE OR REPLACE VIEW vehicle_latest_position_view AS
SELECT
  v.id AS vehicle_id,
  v.company_id,
  v.plate,
  v.brand,
  v.model,
  v.year,
  v.own,
  v.capacity_kg,
  v.provider_party_id,
  v.created_at AS vehicle_created_at,
  v.updated_at AS vehicle_updated_at,

  p.latitude,
  p.longitude,
  p.speed_kph,
  p.heading_deg,
  p.status AS latest_status,
  p.change_type AS latest_change_type,
  p.reported_at AS last_reported_at

FROM vehicles v
LEFT JOIN LATERAL (
  SELECT
    latitude,
    longitude,
    speed_kph,
    heading_deg,
    status,
    change_type,
    reported_at
  FROM vehicle_position_logs
  WHERE vehicle_id = v.id
  ORDER BY reported_at DESC
  LIMIT 1
) p ON TRUE;

