/**
 * 🧪 Teste das Correções no Flutter - Login do Paciente
 * Testa se as URLs e estruturas de dados foram corrigidas
 */

const axios = require('axios');

async function testarCorrecaoFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔧 === TESTE DAS CORREÇÕES FLUTTER ===\n');
    
    console.log('📋 CORREÇÕES APLICADAS:');
    console.log('✅ URL do login paciente: /paciente/login (era /auth/login)');
    console.log('✅ URL do login nutri: /nutri/login (era /auth/login-nutri)');
    console.log('✅ Base URL: http://127.0.0.1:3333 (era localhost)');
    console.log('✅ Estrutura de resposta ajustada para backend\n');
    
    // Testar login do paciente com as credenciais corretas
    try {
        console.log('1️⃣ Testando login do paciente com URL correta...');
        const response = await axios.post(`${baseURL}/paciente/login`, {
            email: 'maria@paciente.com',
            senha: '123456'
        });
        
        console.log('📊 RESPOSTA COMPLETA:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.status === true && response.data.token) {
            console.log('\n✅ TESTE PASSOU!');
            console.log(`🎫 Token: ${response.data.token.substring(0, 30)}...`);
            console.log(`👤 Paciente: ${response.data.paciente.nome}`);
            console.log(`📧 Email: ${response.data.paciente.email}`);
            console.log(`🆔 ID: ${response.data.paciente.paciente_id}`);
            
            // Testar estrutura que o Flutter espera
            console.log('\n📋 VERIFICANDO ESTRUTURA PARA FLUTTER:');
            const userData = response.data;
            
            if (userData.status === true) {
                const token = userData.token;
                const userInfo = userData.paciente;
                
                if (token && userInfo) {
                    const userId = userInfo.paciente_id;
                    const userName = userInfo.nome;
                    const nutriId = userInfo.nutri_id;
                    
                    console.log('✅ Token encontrado:', !!token);
                    console.log('✅ User ID encontrado:', userId);
                    console.log('✅ User Name encontrado:', userName);
                    console.log('✅ Nutri ID encontrado:', nutriId);
                    
                    console.log('\n🎉 ESTRUTURA COMPATÍVEL COM FLUTTER!');
                } else {
                    console.log('❌ Token ou userInfo ausente');
                }
            } else {
                console.log('❌ Status não é true');
            }
            
        } else {
            console.log('❌ Login falhou - verificar resposta acima');
        }
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.response?.data || error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📱 PRÓXIMOS PASSOS:');
    console.log('1. Reiniciar o app Flutter');
    console.log('2. Usar as credenciais: maria@paciente.com / 123456');
    console.log('3. Verificar logs do Flutter com as correções aplicadas');
    console.log('='.repeat(60));
}

// Executa o teste
if (require.main === module) {
    testarCorrecaoFlutter().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = testarCorrecaoFlutter;
