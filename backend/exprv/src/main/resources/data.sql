-- Inserimento Authority
INSERT INTO authority (authority_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN') ON CONFLICT DO NOTHING;

-- Inserimento Authority
INSERT INTO authority (authority_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN') ON CONFLICT DO NOTHING;

-- Inserimento Durate Prenotazione
INSERT INTO reservation_duration (duration_name, minutes, is_active) VALUES 
('1 hour', 60, true),
('4 hours', 240, true),
('Full Day', 480, true) 
ON CONFLICT (duration_name) DO NOTHING;

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
