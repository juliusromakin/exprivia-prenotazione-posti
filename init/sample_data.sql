-- Inserimento Authority
INSERT INTO authority (authority_name) VALUES ('ROLE_USER'), ('ROLE_ADMIN') ON CONFLICT DO NOTHING;

-- Inserimento Utenti (Password: password123 in BCrypt format)
INSERT INTO users (name, last_name, email, password_hash, is_active, created_date, updated_date) 
VALUES ('John', 'Doe', 'admin@example.com', '$2a$10$8.UnVuG9shgE398.M.n.Ue8R5FvTjA.X16z7hJ3R2.7XjH.3R2.7X', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, last_name, email, password_hash, is_active, created_date, updated_date) 
VALUES ('Jane', 'Smith', 'user@example.com', '$2a$10$8.UnVuG9shgE398.M.n.Ue8R5FvTjA.X16z7hJ3R2.7XjH.3R2.7X', true, NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- Associazione Authority-Utenti
INSERT INTO user_authority (user_id, authority_name) 
SELECT id_user, 'ROLE_ADMIN' FROM users WHERE email = 'admin@example.com' ON CONFLICT DO NOTHING;
INSERT INTO user_authority (user_id, authority_name) 
SELECT id_user, 'ROLE_USER' FROM users WHERE email = 'user@example.com' ON CONFLICT DO NOTHING;

-- Inserimento Durate Prenotazione
INSERT INTO reservation_duration (duration_name, minutes, is_active) VALUES 
('1 hour', 60, true),
('4 hours', 240, true),
('Full Day', 480, true) 
ON CONFLICT (duration_name) DO NOTHING;

-- Inserimento Room (English Table)
INSERT INTO room (name, room_type, capacity, is_active, created_date, updated_date) 
VALUES ('Executive Suite', 'OFFICE', 2, true, NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO room (name, room_type, capacity, is_active, created_date, updated_date) 
VALUES ('Main Open Space', 'OPEN_SPACE', 50, true, NOW(), NOW()) ON CONFLICT DO NOTHING;

-- Inserimento Workspace (English Table)
INSERT INTO workspace (name, capacity, workspace_status, is_active, id_room, created_date, updated_date)
SELECT 'Desk-A1', 1, 'AVAILABLE', true, id_room, NOW(), NOW() FROM room WHERE name = 'Main Open Space' LIMIT 1;
INSERT INTO workspace (name, capacity, workspace_status, is_active, id_room, created_date, updated_date)
SELECT 'Desk-A2', 1, 'AVAILABLE', true, id_room, NOW(), NOW() FROM room WHERE name = 'Main Open Space' LIMIT 1;

-- Inserimento Reservation (English Table)
INSERT INTO reservation (id_user, id_workspace, duration_name, start_date, end_date, status_reservation, created_date)
SELECT 
    (SELECT id_user FROM users WHERE email = 'user@example.com'),
    (SELECT id_workspace FROM workspace WHERE name = 'Desk-A1'),
    '4 hours',
    NOW() + interval '1 day',
    NOW() + interval '1 day' + interval '4 hours',
    'CONFIRMED',
    NOW()
LIMIT 1;
