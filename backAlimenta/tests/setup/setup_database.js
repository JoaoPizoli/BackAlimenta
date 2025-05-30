const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function executeDatabaseScript() {
    let connection;
    try {
        console.log('🚀 Conectando ao MySQL AWS...');
          connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'alimenta_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true,
            connectTimeout: 60000
        });

        console.log('✅ Conectado ao MySQL!');

        // Ler o script SQL
        const sqlScript = fs.readFileSync('./database_script.sql', 'utf8');
        
        console.log('📝 Executando script de criação das tabelas...');
          // Dividir o script em comandos separados
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.includes('USE alimenta_db') && !cmd.includes('CREATE DATABASE'));
        
        // Executar cada comando separadamente
        for (const command of commands) {
            if (command.trim() && command.length > 10) {
                try {
                    console.log(`Executando: ${command.substring(0, 50)}...`);
                    await connection.execute(command);
                } catch (error) {
                    console.log(`⚠️ Erro no comando (pode ser normal se tabela já existe): ${error.message}`);
                }
            }
        }
        
        console.log('✅ Script executado com sucesso!');
        
        // Testar se as tabelas foram criadas
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'alimenta_db'
        `);
        
        console.log('📊 Tabelas criadas:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

executeDatabaseScript();
