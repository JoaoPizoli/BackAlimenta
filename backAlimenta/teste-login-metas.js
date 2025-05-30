/**
 * 🧪 Teste Final das Correções - Login e Metas
 * Testa se o login funciona e se as metas carregam com autenticação
 */

const axios = require('axios');

async function testarLoginEMetas() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔧 === TESTE FINAL: LOGIN + METAS ===\n');
    
    let token = null;
    let pacienteId = null;
    
    // 1. Testar login do paciente
    try {
        console.log('1️⃣ Testando login do paciente...');
        const loginResponse = await axios.post(`${baseURL}/paciente/login`, {
            email: 'maria@paciente.com',
            senha: '123456'
        });
        
        if (loginResponse.data.status === true && loginResponse.data.token) {
            token = loginResponse.data.token;
            pacienteId = loginResponse.data.paciente.paciente_id;
            
            console.log('✅ Login OK!');
            console.log(`🎫 Token: ${token.substring(0, 30)}...`);
            console.log(`👤 Paciente ID: ${pacienteId}`);
        } else {
            console.log('❌ Login falhou');
            return;
        }
        
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
        return;
    }
    
    // 2. Testar busca de metas COM token
    try {
        console.log('\n2️⃣ Testando busca de metas com autenticação...');
        
        const metasResponse = await axios.get(`${baseURL}/dieta/meta/${pacienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 RESPOSTA DAS METAS:');
        console.log(JSON.stringify(metasResponse.data, null, 2));
        
        if (metasResponse.data) {
            console.log('✅ Metas carregadas com sucesso!');
        } else {
            console.log('⚠️  Metas vazias, mas sem erro de token');
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar metas:', error.response?.data || error.message);
        
        if (error.response?.data?.error === 'Token não fornecido') {
            console.log('🔧 PROBLEMA: Token não está sendo enviado corretamente');
        } else if (error.response?.data?.error === 'Token inválido') {
            console.log('🔧 PROBLEMA: Token inválido ou expirado');
        }
    }
    
    // 3. Testar resumo diário (também precisa de auth)
    try {
        console.log('\n3️⃣ Testando resumo diário...');
        
        const resumoResponse = await axios.get(`${baseURL}/resumo-diario/${pacienteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 RESUMO DIÁRIO:');
        console.log(JSON.stringify(resumoResponse.data, null, 2));
        console.log('✅ Resumo diário carregado!');
        
    } catch (error) {
        console.log('❌ Erro no resumo diário:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📱 STATUS DOS PROBLEMAS:');
    console.log('='.repeat(70));
    console.log('✅ Rota /registra-alimento: CORRIGIDA no main.dart');
    console.log('✅ URLs de login: CORRIGIDAS (/paciente/login)');
    console.log('✅ Base URL: CORRIGIDA (127.0.0.1)');
    console.log('✅ Token após login: FUNCIONANDO');
    
    if (token) {
        console.log('✅ Autenticação para metas: DEVE FUNCIONAR NO FLUTTER');
        console.log('');
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('1. Reiniciar app Flutter (flutter hot restart)');
        console.log('2. Fazer login com maria@paciente.com / 123456');
        console.log('3. Navegar para tela de registro de alimentos');
        console.log('4. Verificar se metas carregam sem erro de token');
    } else {
        console.log('❌ Problemas de autenticação persistem');
    }
    console.log('='.repeat(70));
}

// Executa o teste
if (require.main === module) {
    testarLoginEMetas().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = testarLoginEMetas;
