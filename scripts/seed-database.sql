-- Criar usuário administrador padrão
INSERT INTO users (id, email, name, password, role, status) 
VALUES (
  'admin-001',
  'admin@globo.com',
  'Administrador Sistema',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshwqBwlaZeYeqsrqeqRrKFe', -- senha: admin123
  'ADMIN',
  'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- Criar usuário operador padrão
INSERT INTO users (id, email, name, password, role, status) 
VALUES (
  'operator-001',
  'operador@globo.com',
  'Operador Sistema',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshwqBwlaZeYeqsrqeqRrKFe', -- senha: admin123
  'OPERATOR',
  'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- Inserir câmeras de exemplo
INSERT INTO cameras (id, name, location, rtsp_url, keywords, status) VALUES
('cam-001', 'Câmera Copacabana', 'Zona Sul', 'rtsp://192.168.1.100:554/stream1', ARRAY['copacabana', 'zona sul', 'praia'], 'ONLINE'),
('cam-002', 'Câmera Tijuca', 'Zona Norte', 'rtsp://192.168.1.101:554/stream1', ARRAY['tijuca', 'zona norte', 'norte'], 'ONLINE'),
('cam-003', 'Câmera Centro', 'Centro', 'rtsp://192.168.1.102:554/stream1', ARRAY['centro', 'downtown', 'cidade'], 'ONLINE'),
('cam-004', 'Câmera Barra', 'Barra da Tijuca', 'rtsp://192.168.1.103:554/stream1', ARRAY['barra', 'barra da tijuca', 'oeste'], 'OFFLINE'),
('cam-005', 'Câmera Ipanema', 'Zona Sul', 'rtsp://192.168.1.104:554/stream1', ARRAY['ipanema', 'zona sul', 'praia'], 'ONLINE'),
('cam-006', 'Câmera Maracanã', 'Zona Norte', 'rtsp://192.168.1.105:554/stream1', ARRAY['maracanã', 'maracana', 'estádio'], 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- Configuração inicial do sistema
INSERT INTO system_config (id, media_mtx_url, voice_threshold, auto_switch_enabled) 
VALUES (
  'config-001',
  'http://localhost:8888',
  85,
  true
) ON CONFLICT (id) DO NOTHING;
