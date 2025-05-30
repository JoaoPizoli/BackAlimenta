const knex = require('knex');

// Configuração do banco MySQL na AWS RDS
const connection = knex({
    client: 'mysql2',
    connection: {
        host: 'alimentaai.crq2w4qgsi42.us-east-1.rds.amazonaws.com',
        port: 3306,
        user: 'admin',
        password: 'dbalimenta',
        database: 'alimenta_db',
        ssl: {
            rejectUnauthorized: false
        }
    },
    pool: {
        min: 0,
        max: 10,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
    },
    debug: false
});

// Teste simples de conexão
connection.raw('SELECT 1')
    .then(() => console.log('✅ Banco MySQL AWS conectado!'))
    .catch(error => console.error('❌ Erro na conexão MySQL:', error.message));

module.exports = connection;