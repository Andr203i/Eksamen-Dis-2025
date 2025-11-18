-- Seed Data for Understory Superhost - MySQL Version
-- Run this AFTER schema.sql

-- Insert test hosts
INSERT INTO hosts (host_name, email, phone, badge_override) VALUES
('KBHBajer', 'kontakt@kbhbajer.dk', '+4512345678', 'auto'),
('Copenhagen Wine Tours', 'info@copenhagenwine.dk', '+4523456789', 'auto'),
('Nordic Food Experience', 'hello@nordicfood.dk', '+4534567890', 'auto'),
('Danish Design Workshop', 'contact@danishdesign.dk', '+4545678901', 'auto'),
('Viking History Tours', 'info@vikingtours.dk', '+4556789012', 'auto');

-- Insert experiences
INSERT INTO experiences (host_id, title, description, price, image_url) VALUES
(1, 'Øl Smagning hos KBHBajer', 'Oplev Københavns bedste håndværksøl i hyggelige omgivelser', 200, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800'),
(2, 'Vin & Tapas Tour i Indre By', 'Guided tour gennem Københavns bedste vinbarer', 450, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800'),
(3, 'New Nordic Cuisine Workshop', 'Lær at lave autentisk nordisk mad', 550, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'),
(4, 'Design & Hygge: Make Your Own Candles', 'Skab dine egne håndlavede lys i dansk stil', 350, 'https://images.unsplash.com/photo-1602874801006-64c0e4a4e838?w=800'),
(5, 'Viking Age Experience', 'Interaktiv oplevelse af vikingetiden', 400, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800');

-- Insert evaluations for Host 1 (KBHBajer) - should get badge (4.9 avg, 25+ reviews)
INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at) VALUES
(1, 5, 'Fantastisk oplevelse! Øllene var lækre og værten var meget vidende.', '+4512340001', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 5, 'Rigtig hyggeligt sted, kan varmt anbefales!', '+4512340002', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 5, 'Perfekt til en firmatur. Alle var super glade.', '+4512340003', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 5, NULL, '+4512340004', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1, 4, 'Godt, men lidt dyrt.', '+4512340005', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 5, 'Bedste øloplevelse i København!', '+4512340006', DATE_SUB(NOW(), INTERVAL 18 DAY)),
(1, 5, NULL, '+4512340007', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1, 5, 'Værten var så passioneret om øl - det smittede!', '+4512340008', DATE_SUB(NOW(), INTERVAL 22 DAY)),
(1, 5, 'Rigtig godt, men lokalet var lidt småt.', '+4512340009', DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1, 5, 'Kommer helt sikkert igen!', '+4512340010', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(1, 5, NULL, '+4512340011', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 5, 'Top oplevelse!', '+4512340012', DATE_SUB(NOW(), INTERVAL 32 DAY)),
(1, 5, NULL, '+4512340013', DATE_SUB(NOW(), INTERVAL 35 DAY)),
(1, 5, 'Meget godt!', '+4512340014', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(1, 5, 'Perfekt datenight!', '+4512340015', DATE_SUB(NOW(), INTERVAL 40 DAY)),
(1, 5, NULL, '+4512340016', DATE_SUB(NOW(), INTERVAL 42 DAY)),
(1, 5, 'Fantastisk!', '+4512340017', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(1, 5, NULL, '+4512340018', DATE_SUB(NOW(), INTERVAL 48 DAY)),
(1, 5, 'Kan kun anbefales!', '+4512340019', DATE_SUB(NOW(), INTERVAL 50 DAY)),
(1, 5, 'Rigtig godt!', '+4512340020', DATE_SUB(NOW(), INTERVAL 52 DAY)),
(1, 5, NULL, '+4512340021', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(1, 5, 'Super hyggelig aften!', '+4512340022', DATE_SUB(NOW(), INTERVAL 58 DAY)),
(1, 5, NULL, '+4512340023', DATE_SUB(NOW(), INTERVAL 60 DAY)),
(1, 5, 'Bedste oplevelse!', '+4512340024', DATE_SUB(NOW(), INTERVAL 62 DAY)),
(1, 5, 'Vil give 6 stjerner hvis jeg kunne!', '+4512340025', DATE_SUB(NOW(), INTERVAL 65 DAY));

-- Insert evaluations for Host 2 (Wine Tours) - should get badge (4.85 avg, 15+ reviews)
INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at) VALUES
(2, 5, 'Fantastisk vintour!', '+4523450001', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 5, 'Lærerig og lækker!', '+4523450002', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 5, NULL, '+4523450003', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(2, 4, 'Rigtig godt!', '+4523450004', DATE_SUB(NOW(), INTERVAL 16 DAY)),
(2, 5, NULL, '+4523450005', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 5, 'Perfekt date!', '+4523450006', DATE_SUB(NOW(), INTERVAL 24 DAY)),
(2, 5, NULL, '+4523450007', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(2, 5, 'Godt!', '+4523450008', DATE_SUB(NOW(), INTERVAL 32 DAY)),
(2, 5, 'Fantastisk!', '+4523450009', DATE_SUB(NOW(), INTERVAL 36 DAY)),
(2, 5, NULL, '+4523450010', DATE_SUB(NOW(), INTERVAL 40 DAY)),
(2, 5, 'Super!', '+4523450011', DATE_SUB(NOW(), INTERVAL 44 DAY)),
(2, 5, NULL, '+4523450012', DATE_SUB(NOW(), INTERVAL 48 DAY)),
(2, 4, 'Godt!', '+4523450013', DATE_SUB(NOW(), INTERVAL 52 DAY)),
(2, 5, 'Bedste vin!', '+4523450014', DATE_SUB(NOW(), INTERVAL 56 DAY)),
(2, 5, 'Anbefales!', '+4523450015', DATE_SUB(NOW(), INTERVAL 60 DAY));

-- Insert evaluations for Host 3 (Nordic Food) - should get badge (4.9 avg, 12+ reviews)
INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at) VALUES
(3, 5, 'Lærerig madlavning!', '+4534560001', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 5, 'Fantastisk!', '+4534560002', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(3, 5, NULL, '+4534560003', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(3, 5, 'Bedste klasse!', '+4534560004', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(3, 5, 'Rigtig godt!', '+4534560005', DATE_SUB(NOW(), INTERVAL 25 DAY)),
(3, 5, NULL, '+4534560006', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(3, 5, 'Perfekt!', '+4534560007', DATE_SUB(NOW(), INTERVAL 35 DAY)),
(3, 5, NULL, '+4534560008', DATE_SUB(NOW(), INTERVAL 40 DAY)),
(3, 5, 'Super fed oplevelse!', '+4534560009', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(3, 5, NULL, '+4534560010', DATE_SUB(NOW(), INTERVAL 50 DAY)),
(3, 5, 'Anbefales!', '+4534560011', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(3, 4, 'Godt!', '+4534560012', DATE_SUB(NOW(), INTERVAL 60 DAY));

-- Insert a few evaluations for other hosts (no badge)
INSERT INTO evaluations (host_id, rating, comment_text, customer_phone, created_at) VALUES
(4, 5, 'Hyggelig workshop!', '+4545670001', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 4, 'Godt!', '+4545670002', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(5, 5, 'Fed vikingeoplevelse!', '+4556780001', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Verify results
SELECT 'Seed data inserted successfully!' as status;
SELECT * FROM vw_host_badge_status ORDER BY avg_rating_90d DESC;