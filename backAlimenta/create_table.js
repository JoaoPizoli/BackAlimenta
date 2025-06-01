const db = require('./src/database/connection');
const fs = require('fs');

async function createTable() {
    try {
        const sql = fs.readFileSync('./create_table.sql', 'utf8');
        await db.raw(sql);
        console.log('✅ Tabela registro_alimento_detalhado criada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error.message);
    } finally {
        process.exit();
    }
}

createTable();
