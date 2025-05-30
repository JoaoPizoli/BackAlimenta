/**
 * 🔍 Teste Direto com Credenciais que Funcionavam
 * Vou testar com as credenciais que você já usava antes
 */

const axios = require('axios');

async function testCredenciaisOriginais() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔍 === TESTANDO CREDENCIAIS ORIGINAIS ===\n');
    
    // Vou testar várias combinações de credenciais que podem existir
    const credenciais = [
        { tipo: 'Nutricionista', endpoint: '/nutri/login', email: 'carlos@nutri.com', senha: '123456' },
        { tipo: 'Nutricionista', endpoint: '/auth/login-nutri', email: 'carlos@nutri.com', senha: '123456' },
        { tipo: 'Paciente', endpoint: '/paciente/login', email: 'maria@paciente.com', senha: '123456' },
        { tipo: 'Paciente', endpoint: '/auth/login-paciente', email: 'maria@paciente.com', senha: '123456' },
        { tipo: 'Admin', endpoint: '/nutri/login', email: 'admin@admin.com', senha: 'admin123' },
    ];

    for (let cred of credenciais) {
        try {
            console.log(`🔐 Testando ${cred.tipo}: ${cred.email} no endpoint ${cred.endpoint}`);
            
            const response = await axios.post(`${baseURL}${cred.endpoint}`, {
                email: cred.email,
                senha: cred.senha
            });

            console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
            
            if (response.data.token) {
                console.log(`✅ SUCESSO! ${cred.tipo} logado com token!`);
                console.log(`🎫 Token: ${response.data.token.substring(0, 30)}...`);
                
                // Se for paciente, esta é a credencial para o Flutter!
                if (cred.tipo === 'Paciente') {
                    console.log('\n🎉 CREDENCIAIS PARA O FLUTTER ENCONTRADAS!');
                    console.log(`📧 Email: ${cred.email}`);
                    console.log(`🔒 Senha: ${cred.senha}`);
                    console.log(`🔗 Endpoint: POST ${baseURL}${cred.endpoint}`);
                    
                    // Testar alimentos com o token
                    try {
                        const alimentosResponse = await axios.get(`${baseURL}/alimentos`, {
                            headers: { 'Authorization': `Bearer ${response.data.token}` }
                        });
                        
                        if (alimentosResponse.data && Array.isArray(alimentosResponse.data)) {
                            console.log(`✅ Alimentos funcionando! Total: ${alimentosResponse.data.length}`);
                        }
                    } catch (err) {
                        console.log('⚠️ Alimentos com autenticação falhou, testando sem token...');
                        
                        try {
                            const alimentosPublic = await axios.get(`${baseURL}/alimentos`);
                            console.log(`✅ Alimentos públicos! Total: ${alimentosPublic.data.length}`);
                        } catch (err2) {
                            console.log('❌ Alimentos não funcionando');
                        }
                    }
                }
                
            } else {
                console.log(`⚠️ Login retornou sucesso mas sem token para ${cred.tipo}`);
            }
            
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            console.log(`❌ ${cred.tipo} falhou (${status}): ${message}`);
        }
        
        console.log(''); // Linha em branco
    }
    
    // Testar alimentos sem autenticação
    console.log('🥗 Testando alimentos sem autenticação...');
    try {
        const response = await axios.get(`${baseURL}/alimentos`);
        
        if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Alimentos públicos funcionando! Total: ${response.data.length}`);
            
            if (response.data.length > 0) {
                console.log('\n🍎 Exemplos de alimentos:');
                response.data.slice(0, 3).forEach((alimento, i) => {
                    console.log(`   ${i+1}. ${alimento.nome} - ${alimento.energia_kcal || 0}kcal`);
                });
            }
        }
    } catch (error) {
        console.log('❌ Alimentos públicos falharam:', error.response?.data || error.message);
    }
}

// Executa o teste
if (require.main === module) {
    testCredenciaisOriginais().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = testCredenciaisOriginais;
