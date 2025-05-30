const axios = require('axios');

async function testarLoginPacienteNovo() {
    const baseURL = 'http://127.0.0.1:3333';
    
    try {
        console.log('🔐 Testando login do paciente novo...');
        const result = await axios.post(`${baseURL}/auth/login`, {
            email: 'joao.teste@email.com',
            senha: '123456',
            tipo: 'paciente'
        });
        
        console.log('✅ Login bem-sucedido!');
        console.log('- Status:', result.data.status);
        console.log('- Paciente ID:', result.data.paciente?.paciente_id);
        console.log('- Nome:', result.data.paciente?.nome);
        console.log('- Token presente:', result.data.token ? 'SIM' : 'NÃO');
        
        if (result.data.token) {
            console.log('- Token (primeiros 30 chars):', result.data.token.substring(0, 30) + '...');
        }
        
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
    }
}

testarLoginPacienteNovo();
