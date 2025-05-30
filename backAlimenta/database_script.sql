-- Script para criação do banco de dados MySQL - Sistema Alimenta
-- Baseado na estrutura do projeto backAlimenta

-- NOTA: A tabela de alimentos foi removida deste script pois será
-- implementada com SQLite in-memory usando dados da tabela TACO

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS alimenta_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alimenta_db;

-- Tabela de Nutricionistas
CREATE TABLE nutri (
    nutri_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nutri_email (email)
);

-- Tabela de Pacientes
CREATE TABLE paciente (
    paciente_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    peso DECIMAL(5,2),
    nutri_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nutri_id) REFERENCES nutri(nutri_id) ON DELETE CASCADE,
    INDEX idx_paciente_email (email),
    INDEX idx_paciente_nutri (nutri_id),
    INDEX idx_paciente_ativo (ativo)
);

-- Tabela de Alimentos - REMOVIDA
-- A tabela de alimentos agora usa SQLite in-memory com dados da tabela TACO
-- para consultas extremamente rápidas. Veja o serviço alimentoInMemoryService.js

-- Tabela de Dietas (METAS DIÁRIAS definidas pela nutricionista)
CREATE TABLE dieta (
    dieta_id INT AUTO_INCREMENT PRIMARY KEY,
    proteina DECIMAL(8,2) NOT NULL COMMENT 'Meta diária de proteína em gramas',
    carbo DECIMAL(8,2) NOT NULL COMMENT 'Meta diária de carboidrato em gramas',
    gordura DECIMAL(8,2) NOT NULL COMMENT 'Meta diária de gordura em gramas',
    calorias DECIMAL(8,2) NOT NULL COMMENT 'Meta diária de calorias',
    paciente_id INT NOT NULL,
    nutri_id INT NOT NULL,
    data DATE NOT NULL COMMENT 'Data para qual a meta é válida',
    ativo BOOLEAN DEFAULT TRUE COMMENT 'Se a meta está ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES paciente(paciente_id) ON DELETE CASCADE,
    FOREIGN KEY (nutri_id) REFERENCES nutri(nutri_id) ON DELETE CASCADE,
    INDEX idx_dieta_paciente (paciente_id),
    INDEX idx_dieta_nutri (nutri_id),
    INDEX idx_dieta_data (data),
    INDEX idx_dieta_ativo (ativo),
    UNIQUE KEY unique_dieta_paciente_data (paciente_id, data)
);

-- Tabela de Registro Diário (TOTAIS DIÁRIOS de macros consumidos)
CREATE TABLE registro_diario (
    paciente_id INT NOT NULL,
    data_registro DATE NOT NULL,
    proteina_total DECIMAL(8,2) DEFAULT 0 COMMENT 'Total de proteínas do dia (gramas)',
    carboidrato_total DECIMAL(8,2) DEFAULT 0 COMMENT 'Total de carboidratos do dia (gramas)',
    gordura_total DECIMAL(8,2) DEFAULT 0 COMMENT 'Total de gorduras do dia (gramas)',
    calorias_total DECIMAL(8,2) DEFAULT 0 COMMENT 'Total de calorias do dia (kcal)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (paciente_id, data_registro),
    FOREIGN KEY (paciente_id) REFERENCES paciente(paciente_id) ON DELETE CASCADE,
    INDEX idx_registro_data (data_registro),
    INDEX idx_registro_paciente_data (paciente_id, data_registro)
);

-- Tabela de relacionamento entre Dietas e Alimentos (opcional - para vincular alimentos específicos às dietas)
-- NOTA: Como a tabela alimento agora é in-memory, essa tabela de relacionamento
-- pode armazenar apenas o ID do alimento do banco in-memory ou o nome do alimento
CREATE TABLE dieta_alimento (
    dieta_alimento_id INT AUTO_INCREMENT PRIMARY KEY,
    dieta_id INT NOT NULL,
    alimento_nome VARCHAR(255) NOT NULL, -- Nome do alimento da tabela TACO
    alimento_id_memory INT, -- ID do alimento no banco in-memory (opcional)
    quantidade DECIMAL(8,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dieta_id) REFERENCES dieta(dieta_id) ON DELETE CASCADE,
    INDEX idx_dieta_alimento_dieta (dieta_id),
    INDEX idx_dieta_alimento_nome (alimento_nome)
);

-- Inserir alguns dados de exemplo para teste

-- Inserir nutricionista de exemplo
INSERT INTO nutri (nome, email, senha, telefone) VALUES 
('Dr. João Silva', 'joao@nutri.com', '$2a$10$example.hash.password', '(11) 99999-9999'),
('Dra. Maria Santos', 'maria@nutri.com', '$2a$10$example.hash.password', '(11) 88888-8888');

-- NOTA: Alimentos são carregados automaticamente do CSV TACO no banco in-memory

-- Criar usuário para a aplicação (opcional - ajustar conforme necessário)
-- CREATE USER 'alimenta_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';
-- GRANT ALL PRIVILEGES ON alimenta_db.* TO 'alimenta_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Comentários sobre as tabelas:
-- 
-- nutri: Armazena dados dos nutricionistas
-- paciente: Armazena dados dos pacientes, vinculados aos nutricionistas
-- dieta: METAS DIÁRIAS definidas pelos nutricionistas (proteína, carbo, gordura, calorias)
-- registro_diario: CONSUMO REAL registrado via IA ou manualmente pelos pacientes
-- dieta_alimento: Tabela de relacionamento para vincular alimentos específicos às dietas (opcional)
-- 
-- FLUXO DO SISTEMA:
-- 1. Nutricionista define METAS na tabela 'dieta'
-- 2. Paciente registra CONSUMO via áudio/IA na tabela 'registro_diario'
-- 3. App Flutter calcula: META - CONSUMO = RESTANTE
-- 
-- ALIMENTOS: Implementados em SQLite in-memory usando dados da tabela TACO
-- - Carregados automaticamente do arquivo CSV na pasta /data/
-- - Consultas extremamente rápidas por estarem em memória
-- - Recriados a cada inicialização do servidor
-- - Ideal para busca com IA e processamento de linguagem natural
--
-- Índices foram criados para otimizar consultas frequentes
-- Constraints de chave estrangeira garantem integridade referencial
-- Timestamps automáticos para auditoria
-- Charset UTF8MB4 para suporte completo a emojis e caracteres especiais
