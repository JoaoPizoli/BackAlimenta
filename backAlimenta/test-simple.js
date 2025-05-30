/**
 * 🚀 Teste Simples e Rápido - AlimentaAI
 * Executa apenas os testes essenciais para desenvolvimento
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

class SimpleTest {
    constructor() {
        this.baseURL = 'http://127.0.0.1:3333';
        this.results = [];
    }

    log(emoji, message, status = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${emoji} ${message}`);
        
        if (status !== 'info') {
            this.results.push({ message, status, timestamp });
        }
    }

    async testDatabase() {
        try {
            this.log('🔍', 'Testando conexão com banco...');
            
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306,
                connectTimeout: 5000
            });

            await connection.execute('SELECT 1');
            await connection.end();
            
            this.log('✅', 'Banco de dados OK', 'pass');
            return true;
            
        } catch (error) {
            this.log('❌', `Banco falhou: ${error.message}`, 'fail');
            return false;
        }
    }

    async testServer() {
        try {
            this.log('🔍', 'Testando servidor...');
            
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                this.log('✅', 'Servidor OK', 'pass');
                return true;
            } else {
                this.log('❌', `Servidor retornou status ${response.status}`, 'fail');
                return false;
            }
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                this.log('❌', 'Servidor não está rodando na porta 3333', 'fail');
            } else {
                this.log('❌', `Servidor falhou: ${error.message}`, 'fail');
            }
            return false;
        }
    }

    async testLogin() {
        try {
            this.log('🔍', 'Testando login...');
            
            const response = await axios.post(`${this.baseURL}/auth/login-nutri`, {
                email: 'carlos@nutri.com',
                senha: '123456'
            }, {
                timeout: 5000
            });

            if (response.data.token && response.data.nutri) {
                this.log('✅', 'Login OK', 'pass');
                return { success: true, token: response.data.token };
            } else {
                this.log('❌', 'Login falhou - sem token ou dados', 'fail');
                return { success: false };
            }
            
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            this.log('❌', `Login falhou: ${msg}`, 'fail');
            return { success: false };
        }
    }

    async testAPI(token) {
        try {
            this.log('🔍', 'Testando API com autenticação...');
            
            const response = await axios.get(`${this.baseURL}/pacientes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: 5000
            });

            if (response.status === 200) {
                this.log('✅', 'API OK', 'pass');
                return true;
            } else {
                this.log('❌', `API retornou status ${response.status}`, 'fail');
                return false;
            }
            
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            this.log('❌', `API falhou: ${msg}`, 'fail');
            return false;
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMO DO TESTE');
        console.log('='.repeat(50));
        
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const total = passed + failed;
        
        console.log(`✅ Passou: ${passed}`);
        console.log(`❌ Falhou: ${failed}`);
        console.log(`📝 Total: ${total}`);
        
        if (total > 0) {
            const percentage = ((passed / total) * 100).toFixed(1);
            console.log(`📊 Taxa de sucesso: ${percentage}%`);
        }
        
        if (failed === 0 && total > 0) {
            console.log('\n🎉 Todos os testes passaram! Sistema funcionando.');
        } else if (failed > 0) {
            console.log('\n🚨 Alguns testes falharam. Verifique os logs acima.');
        }
        
        console.log('='.repeat(50));
    }

    async run() {
        console.log('⚡ TESTE RÁPIDO - AlimentaAI Backend');
        console.log('='.repeat(50));
        
        // 1. Teste de banco
        const dbOk = await this.testDatabase();
        
        // 2. Teste de servidor
        const serverOk = await this.testServer();
        
        if (!serverOk) {
            this.log('⚠️', 'Pulando testes de API - servidor offline');
            this.printSummary();
            return;
        }
        
        // 3. Teste de login
        const loginResult = await this.testLogin();
        
        if (loginResult.success) {
            // 4. Teste de API autenticada
            await this.testAPI(loginResult.token);
        } else {
            this.log('⚠️', 'Pulando teste de API - login falhou');
        }
        
        this.printSummary();
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    const test = new SimpleTest();
    test.run().catch(error => {
        console.error('❌ Erro fatal no teste:', error.message);
        process.exit(1);
    });
}

module.exports = SimpleTest;
