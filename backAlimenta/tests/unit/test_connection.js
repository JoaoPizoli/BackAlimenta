const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('🚀 Testando conexão ao MySQL AWS...');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`User: ${process.env.DB_USER}`);
        console.log(`Port: ${process.env.DB_PORT}`);
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            connectTimeout: 10000
        });

        console.log('✅ Conectado ao MySQL!');
        
        // Testar query simples
        const [result] = await connection.execute('SELECT 1 as test');
        console.log('📊 Query teste:', result);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        console.error('Stack:', error.stack);
    }
}

testConnection();
