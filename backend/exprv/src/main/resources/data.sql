-- Inserimento Authority
INSERT INTO authority (authority_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN') ON CONFLICT DO NOTHING;

-- Inserimento Utenti (Password: password123 in BCrypt format)
-- Nota: La colonna per enabled è "is_active" nell'entità User
INSERT INTO users (name, last_name, email, password_hash, is_active, created_date, updated_date) 
VALUES ('John', 'Doe', 'admin@example.com', '$2a$10$8.UnVuG9shgE398.M.n.Ue8R5FvTjA.X16z7hJ3R2.7XjH.3R2.7X', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, last_name, email, password_hash, is_active, created_date, updated_date) 
VALUES ('Jane', 'Smith', 'user@example.com', '$2a$10$8.UnVuG9shgE398.M.n.Ue8R5FvTjA.X16z7hJ3R2.7XjH.3R2.7X', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- Associazione Authority-Utenti (Nota: colonna PK di users è "id")
INSERT INTO user_authority (user_id, authority_name) 
SELECT id, 'ROLE_ADMIN' FROM users WHERE email = 'admin@example.com' ON CONFLICT DO NOTHING;

INSERT INTO user_authority (user_id, authority_name) 
SELECT id, 'ROLE_USER' FROM users WHERE email = 'user@example.com' ON CONFLICT DO NOTHING;

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

-- Inserimento Reservation (English Table)
-- Usiamo una query che inserisce solo se non esiste già una prenotazione per lo stesso utente e workspace nello stesso orario
INSERT INTO reservation (id_user, id_workspace, duration_name, start_date, end_date, status, created_date)
SELECT 
    u.id,
    w.id,
    '4 hours',
    NOW() + interval '1 day',
    NOW() + interval '1 day' + interval '4 hours',
    'CONFIRMED',
    NOW()
FROM users u, workspace w
WHERE u.email = 'user@example.com' 
  AND w.name = 'Desk-A1'
  AND NOT EXISTS (
      SELECT 1 FROM reservation r 
      WHERE r.id_user = u.id 
        AND r.id_workspace = w.id 
        AND r.start_date > NOW() -- Evita duplicati per prenotazioni future
  )
LIMIT 1;
