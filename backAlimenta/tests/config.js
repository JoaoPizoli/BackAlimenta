/**
 * Configuração Global dos Testes
 */

module.exports = {
    // URL base do servidor
    baseURL: 'http://127.0.0.1:3333',
    
    // Timeouts
    timeout: {
        default: 5000,
        long: 10000,
        short: 2000
    },
    
    // Dados de teste padrão
    testData: {
        nutricionista: {
            email: 'carlos@nutri.com',
            senha: '123456'
        },
        paciente: {
            nome: 'Paciente Teste',
            email: 'paciente@teste.com',
            senha: '123456',
            idade: 25,
            peso: 70,
            altura: 175
        }
    },
    
    // Configurações do banco
    database: {
        retries: 3,
        retryDelay: 1000
    },
    
    // Configurações de log
    logging: {
        verbose: process.env.TEST_VERBOSE === 'true',
        showTimestamps: true,
        colors: {
            pass: '\x1b[32m', // Verde
            fail: '\x1b[31m', // Vermelho
            info: '\x1b[36m', // Ciano
            warn: '\x1b[33m', // Amarelo
            reset: '\x1b[0m'  // Reset
        }
    }
};
