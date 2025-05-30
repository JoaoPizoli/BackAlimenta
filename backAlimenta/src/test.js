const axios = require('axios');

const baseURL = 'http://localhost:3333';
let authToken = '';
let nutriId = null;

async function runTests() {
    try {
        console.log('\n=== Iniciando testes ===\n');

        // Verificar se o servidor está rodando
        try {
            await axios.get(`${baseURL}/health`);
        } catch (error) {
            throw new Error('Servidor não está rodando. Execute npm run dev primeiro.');
        }

        // Test 1: Database check
        console.log('1. Verificando banco de dados...');
        const dbStatus = await axios.get(`${baseURL}/test-db`);
        console.log('Status do banco:', dbStatus.data);

        // Test 2: Login admin
        console.log('\n2. Testando login do admin...');
        const loginRes = await axios.post(`${baseURL}/nutri/login`, {
            email: 'admin@admin.com',
            senha: 'admin123'
        });
        authToken = loginRes.data.token;
        nutriId = loginRes.data.nutri.nutri_id;
        console.log('Login bem sucedido, token obtido');

        // Test 3: Criar paciente
        console.log('\n3. Criando paciente teste...');
        const pacienteData = {
            nome: 'Paciente Teste',
            email: `teste${Date.now()}@test.com`,
            senha: '123456',
            telefone: '11999999999',
            peso: 70.5,
            nutri_id: nutriId
        };
        const pacienteRes = await axios.post(
            `${baseURL}/paciente/register`, 
            pacienteData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('Paciente criado:', pacienteRes.data);

        console.log('\n=== Testes concluídos com sucesso ===\n');
    } catch (error) {
        console.error('\n❌ Erro nos testes:');
        if (error.response) {
            console.error('Resposta do servidor:', error.response.data);
        } else if (error.request) {
            console.error('Erro de conexão:', error.message);
        } else {
            console.error('Erro:', error.message);
        }
        process.exit(1);
    }
}

// Executa os testes
console.log('🚀 Iniciando testes...');
runTests();
