/**
 * 🔍 Diagnóstico de Login para Flutter
 * Testa exatamente como o Flutter tentaria fazer login
 */

const axios = require('axios');

async function diagnosticoLoginFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔍 === DIAGNÓSTICO LOGIN FLUTTER ===\n');
    
    // Verificar se o servidor está rodando
    try {
        console.log('1️⃣ Verificando se servidor está rodando...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Servidor rodando! Status:', healthResponse.data);
    } catch (error) {
        console.log('❌ Servidor não está rodando!');
        console.log('💡 Execute: npm start');
        return;
    }
    
    // Testar endpoint exato de login
    console.log('\n2️⃣ Testando endpoint de login do paciente...');
    
    const loginData = {
        email: 'maria@paciente.com',
        senha: '123456'
    };
    
    try {
        console.log('📤 Enviando requisição:', JSON.stringify(loginData, null, 2));
        console.log('🔗 URL:', `${baseURL}/paciente/login`);
        
        const response = await axios.post(`${baseURL}/paciente/login`, loginData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('\n✅ RESPOSTA DO SERVIDOR:');
        console.log('📊 Status:', response.status);
        console.log('📋 Headers:', JSON.stringify(response.headers, null, 2));
        console.log('💾 Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.token) {
            console.log('\n🎉 LOGIN FUNCIONANDO!');
            console.log('🎫 Token encontrado:', response.data.token.substring(0, 30) + '...');
        } else {
            console.log('\n⚠️ Login retornou sucesso mas sem token!');
        }
        
    } catch (error) {
        console.log('\n❌ ERRO NO LOGIN:');
        console.log('📊 Status:', error.response?.status);
        console.log('📋 Mensagem:', error.response?.data);
        console.log('🔍 Erro completo:', error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 POSSÍVEL PROBLEMA: Endpoint não encontrado');
            console.log('   Verifique se a rota /paciente/login existe');
        } else if (error.response?.status === 401) {
            console.log('\n💡 POSSÍVEL PROBLEMA: Credenciais inválidas');
            console.log('   Verifique email e senha');
        } else if (error.response?.status === 500) {
            console.log('\n💡 POSSÍVEL PROBLEMA: Erro interno do servidor');
            console.log('   Verifique logs do servidor');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 POSSÍVEL PROBLEMA: Servidor não está rodando');
            console.log('   Execute: npm start');
        }
    }
    
    // Testar se existem outras rotas de login
    console.log('\n3️⃣ Testando rotas alternativas...');
    
    const rotasAlternativas = [
        '/auth/login-paciente',
        '/login/paciente',
        '/api/paciente/login'
    ];
    
    for (let rota of rotasAlternativas) {
        try {
            console.log(`🔍 Testando: ${rota}`);
            const response = await axios.post(`${baseURL}${rota}`, loginData);
            console.log(`✅ ${rota} funcionou!`);
            console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log(`❌ ${rota} falhou: ${error.response?.status || error.message}`);
        }
    }
    
    // Verificar CORS
    console.log('\n4️⃣ Verificando CORS...');
    try {
        const response = await axios.options(`${baseURL}/paciente/login`);
        console.log('✅ CORS OK');
        console.log('📋 Headers CORS:', {
            'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
            'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
            'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
        });
    } catch (error) {
        console.log('⚠️ CORS pode ter problemas:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 INFORMAÇÕES PARA O FLUTTER');
    console.log('='.repeat(60));
    console.log('🔗 URL Base: http://127.0.0.1:3333');
    console.log('🔗 Endpoint Login: /paciente/login');
    console.log('📧 Email: maria@paciente.com');
    console.log('🔒 Senha: 123456');
    console.log('');
    console.log('📋 Headers necessários:');
    console.log('   Content-Type: application/json');
    console.log('');
    console.log('📋 Body JSON:');
    console.log('   {');
    console.log('     "email": "maria@paciente.com",');
    console.log('     "senha": "123456"');
    console.log('   }');
    console.log('='.repeat(60));
}

// Executa o diagnóstico
if (require.main === module) {
    diagnosticoLoginFlutter().catch(error => {
        console.error('❌ Erro fatal no diagnóstico:', error.message);
        process.exit(1);
    });
}

module.exports = diagnosticoLoginFlutter;
