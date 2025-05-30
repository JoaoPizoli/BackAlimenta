const axios = require('axios');

async function testarNovaEstrutura() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🧪 === TESTANDO NOVA ESTRUTURA DE RESPOSTA ===\n');
    
    try {
        console.log('1️⃣ Testando login do paciente (nova estrutura)...');
        const result = await axios.post(`${baseURL}/auth/login`, {
            email: 'joao.teste@email.com',
            senha: '123456',
            tipo: 'paciente'
        });
        
        console.log('✅ Resposta recebida:');
        console.log(JSON.stringify(result.data, null, 2));
        
        // Verificar se tem a estrutura esperada pelo Flutter
        if (result.data.success && result.data.data) {
            console.log('\n🎯 Estrutura compatível com Flutter:');
            console.log('- success:', result.data.success);
            console.log('- data.id:', result.data.data.id);
            console.log('- data.nome:', result.data.data.nome);
            console.log('- data.token:', result.data.data.token ? 'PRESENTE' : 'AUSENTE');
            console.log('- data.tipo:', result.data.data.tipo);
        }
        
    } catch (error) {
        console.log('❌ Erro:', error.response?.data || error.message);
    }
    
    console.log('\n');
    
    try {
        console.log('2️⃣ Testando login do nutricionista (nova estrutura)...');
        const result = await axios.post(`${baseURL}/auth/login-nutri`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        console.log('✅ Resposta recebida:');
        console.log(JSON.stringify(result.data, null, 2));
        
    } catch (error) {
        console.log('❌ Erro:', error.response?.data || error.message);
    }
}

testarNovaEstrutura();
