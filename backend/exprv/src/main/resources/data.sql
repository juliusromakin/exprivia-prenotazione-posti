
-- Inserimento Durate Prenotazione
INSERT INTO reservation_duration (duration_name, minutes, is_active) VALUES 
('1 hour', 60, true),
('4 hours', 240, true),
('Full Day', 480, true) 
ON CONFLICT (duration_name) DO NOTHING;

-- Inserimento Sede, Edificio e Piano se non esistono
INSERT INTO location (name, city, enabled, created_date, updated_date)
SELECT 'Sede Principale', 'ROMA', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM location WHERE name = 'Sede Principale');

INSERT INTO building (address, id_location, enabled, created_date, updated_date)
SELECT 'Edificio A', (SELECT id FROM location WHERE name = 'Sede Principale' LIMIT 1), true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM building WHERE address = 'Edificio A');

INSERT INTO floor (name, id_building, enabled, created_date, updated_date)
SELECT 'Piano Terra', (SELECT id FROM building WHERE address = 'Edificio A' LIMIT 1), true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM floor WHERE name = 'Piano Terra');

-- Inserimento Room (English Table)
-- Nota: La colonna per abilitazione è "enabled" in queste tabelle
-- Aggiunto ON CONFLICT (name) per evitare crash al riavvio
INSERT INTO room (name, room_type, capacity, enabled, created_date, updated_date) 
VALUES ('Executive Suite', 'OFFICE', 2, true, NOW(), NOW()) ON CONFLICT (name) DO NOTHING;

INSERT INTO room (name, room_type, capacity, enabled, created_date, updated_date) 
VALUES ('Main Open Space', 'OPEN_SPACE', 50, true, NOW(), NOW()) ON CONFLICT (name) DO NOTHING;

-- Inserimento Workspace (English Table)
-- Aggiunto ON CONFLICT (name) per evitare crash al riavvio
INSERT INTO workspace (name, capacity, status, enabled, id_room, created_date, updated_date)
SELECT 'Desk-A1', 1, 'AVAILABLE', true, id, NOW(), NOW() FROM room WHERE name = 'Main Open Space' 
ON CONFLICT (name) DO NOTHING;

INSERT INTO workspace (name, capacity, status, enabled, id_room, created_date, updated_date)
SELECT 'Desk-A2', 1, 'AVAILABLE', true, id, NOW(), NOW() FROM room WHERE name = 'Main Open Space' 
ON CONFLICT (name) DO NOTHING;
