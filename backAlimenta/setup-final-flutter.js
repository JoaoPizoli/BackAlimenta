/**
 * 📱 Setup Final para Flutter - Criar Paciente via API
 * Usa o token do nutricionista para criar um paciente e depois testa o login
 */

const axios = require('axios');

async function setupFinalFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('📱 === SETUP FINAL PARA FLUTTER ===\n');
    
    let nutriToken = null;
    
    // 1. Login do nutricionista para pegar token
    try {
        console.log('1️⃣ Fazendo login do nutricionista...');
        const nutriResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        nutriToken = nutriResponse.data.token;
        const nutriId = nutriResponse.data.nutri.nutri_id;
        
        console.log('✅ Nutricionista logado!');
        console.log(`   Token: ${nutriToken.substring(0, 30)}...`);
        console.log(`   ID: ${nutriId}`);
        
        // 2. Criar paciente usando a API
        console.log('\n2️⃣ Criando paciente via API...');
        
        try {
            const pacienteResponse = await axios.post(`${baseURL}/paciente/register`, {
                nome: 'Maria Silva',
                email: 'maria@paciente.com',
                senha: '123456',
                telefone: '11999999999',
                peso: 65,
                nutri_id: nutriId
            }, {
                headers: {
                    'Authorization': `Bearer ${nutriToken}`
                }
            });
            
            console.log('✅ Paciente criado via API!');
            console.log('📊 Resposta:', JSON.stringify(pacienteResponse.data, null, 2));
            
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  Paciente já existe - tudo OK!');
            } else {
                console.log('⚠️  Erro ao criar paciente:', error.response?.data || error.message);
                
                // Tentar sem autenticação
                try {
                    console.log('   Tentando criar sem token...');
                    await axios.post(`${baseURL}/paciente/register`, {
                        nome: 'Maria Silva',
                        email: 'maria@paciente.com',
                        senha: '123456',
                        telefone: '11999999999',
                        peso: 65,
                        nutri_id: nutriId
                    });
                    console.log('✅ Paciente criado sem autenticação!');
                } catch (err2) {
                    console.log('❌ Falha total ao criar paciente:', err2.response?.data || err2.message);
                }
            }
        }
        
        // 3. Testar login do paciente
        console.log('\n3️⃣ Testando login do paciente...');
        
        try {
            const loginResponse = await axios.post(`${baseURL}/paciente/login`, {
                email: 'maria@paciente.com',
                senha: '123456'
            });
            
            console.log('📊 Resposta do login:', JSON.stringify(loginResponse.data, null, 2));
            
            if (loginResponse.data.token) {
                console.log('\n🎉 LOGIN DO PACIENTE FUNCIONANDO!');
                console.log(`🎫 Token: ${loginResponse.data.token.substring(0, 30)}...`);
                
                // 4. Testar alimentos com token do paciente
                console.log('\n4️⃣ Testando alimentos com token do paciente...');
                
                try {
                    const alimentosResponse = await axios.get(`${baseURL}/alimentos`, {
                        headers: {
                            'Authorization': `Bearer ${loginResponse.data.token}`
                        }
                    });
                    
                    if (alimentosResponse.data && Array.isArray(alimentosResponse.data)) {
                        console.log(`✅ Alimentos funcionando! Total: ${alimentosResponse.data.length}`);
                        
                        if (alimentosResponse.data.length > 0) {
                            console.log('\n🍎 Primeiros alimentos:');
                            alimentosResponse.data.slice(0, 5).forEach((alimento, i) => {
                                console.log(`   ${i+1}. ${alimento.nome} - ${alimento.energia_kcal || 0}kcal`);
                            });
                        }
                    }
                } catch (alimentosError) {
                    console.log('❌ Erro ao buscar alimentos:', alimentosError.response?.data || alimentosError.message);
                }
                
            } else {
                console.log('❌ Login do paciente sem token');
            }
            
        } catch (loginError) {
            console.log('❌ Erro no login do paciente:', loginError.response?.data || loginError.message);
        }
        
    } catch (error) {
        console.log('❌ Erro no login do nutricionista:', error.response?.data || error.message);
        return;
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📱 CREDENCIAIS FINAIS PARA O APP FLUTTER');
    console.log('='.repeat(70));
    console.log('📧 Email: maria@paciente.com');
    console.log('🔒 Senha: 123456');
    console.log('');
    console.log('🔗 ENDPOINTS PARA O FLUTTER:');
    console.log(`   🔐 Login: POST ${baseURL}/paciente/login`);
    console.log(`   🥗 Alimentos: GET ${baseURL}/alimentos (com Authorization header)`);
    console.log('');
    console.log('📋 FORMATO DO BODY DE LOGIN:');
    console.log('   {');
    console.log('     "email": "maria@paciente.com",');
    console.log('     "senha": "123456"');
    console.log('   }');
    console.log('');
    console.log('📋 FORMATO DO HEADER PARA ALIMENTOS:');
    console.log('   Authorization: Bearer {token_do_login}');
    console.log('');
    console.log('🎯 Use essas informações no seu app Flutter!');
    console.log('='.repeat(70));
}

// Executa o teste
if (require.main === module) {
    setupFinalFlutter().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = setupFinalFlutter;
