const mysql = require('mysql2/promise');
require('dotenv').config();

async function testarMeta() {
    let connection;
    try {
        console.log('🔧 Testando criação de meta diretamente...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'alimenta_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conectado ao MySQL!');

        // Testar inserção na tabela dieta
        const [result] = await connection.execute(`
            INSERT INTO dieta 
            (proteina, carbo, gordura, calorias, paciente_id, nutri_id, data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            proteina = VALUES(proteina),
            carbo = VALUES(carbo),
            gordura = VALUES(gordura),
            calorias = VALUES(calorias),
            updated_at = CURRENT_TIMESTAMP
        `, [150, 250, 80, 2200, 2, 4, '2025-05-26']);

        console.log('✅ Meta criada/atualizada:', result);
        
        // Verificar se foi inserida
        const [check] = await connection.execute(
            'SELECT * FROM dieta WHERE paciente_id = ? AND data = ?',
            [2, '2025-05-26']
        );
        
        console.log('📊 Meta no banco:', check[0]);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testarMeta();
