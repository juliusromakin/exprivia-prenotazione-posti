
-- Inserimento Durate Prenotazione
INSERT INTO reservation_duration (duration_name, minutes, is_active) VALUES 
('1 hour', 60, true),
('4 hours', 240, true),
('Full Day', 480, true) 
ON CONFLICT (duration_name) DO NOTHING;


