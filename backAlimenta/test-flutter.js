/**
 * 🧪 Teste Completo para Flutter - Login e Alimentos
 * Verifica se o login funciona e se os dados de alimentos estão disponíveis
 */

const axios = require('axios');

async function testForFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('📱 === TESTE PARA FLUTTER APP ===\n');
    
    // Dados de login para teste
    const credenciais = {
        nutricionista: {
            email: 'carlos@nutri.com',
            senha: '123456'
        },
        paciente: {
            email: 'maria@paciente.com', 
            senha: '123456'
        }
    };

    console.log('🔑 CREDENCIAIS PARA USAR NO FLUTTER:');
    console.log('📧 Email Nutricionista:', credenciais.nutricionista.email);
    console.log('🔒 Senha Nutricionista:', credenciais.nutricionista.senha);
    console.log('📧 Email Paciente:', credenciais.paciente.email);
    console.log('🔒 Senha Paciente:', credenciais.paciente.senha);
    console.log('');

    let nutriToken = null;
    let pacienteToken = null;

    // Teste 1: Login do Nutricionista
    try {
        console.log('1️⃣ Testando login do NUTRICIONISTA...');
        const response = await axios.post(`${baseURL}/auth/login-nutri`, {
            email: credenciais.nutricionista.email,
            senha: credenciais.nutricionista.senha
        });

        if (response.data && response.data.token) {
            nutriToken = response.data.token;
            console.log('✅ Login nutricionista OK!');
            console.log('   Token:', nutriToken.substring(0, 20) + '...');
            console.log('   Nutri ID:', response.data.nutri?.nutri_id || response.data.id);
            console.log('   Nome:', response.data.nutri?.nome || 'N/A');
        } else {
            console.log('❌ Login nutricionista falhou - sem token');
        }
    } catch (error) {
        console.log('❌ Erro no login nutricionista:', error.response?.data?.message || error.message);
    }

    // Teste 2: Login do Paciente  
    try {
        console.log('\n2️⃣ Testando login do PACIENTE...');
        const response = await axios.post(`${baseURL}/auth/login-paciente`, {
            email: credenciais.paciente.email,
            senha: credenciais.paciente.senha
        });

        if (response.data && response.data.token) {
            pacienteToken = response.data.token;
            console.log('✅ Login paciente OK!');
            console.log('   Token:', pacienteToken.substring(0, 20) + '...');
            console.log('   Paciente ID:', response.data.paciente?.paciente_id || response.data.id);
            console.log('   Nome:', response.data.paciente?.nome || 'N/A');
        } else {
            console.log('❌ Login paciente falhou - sem token');
        }
    } catch (error) {
        console.log('❌ Erro no login paciente:', error.response?.data?.message || error.message);
    }

    // Teste 3: Buscar Alimentos (sem autenticação - deve funcionar)
    try {
        console.log('\n3️⃣ Testando busca de ALIMENTOS...');
        const response = await axios.get(`${baseURL}/alimentos`);

        if (response.data && Array.isArray(response.data)) {
            console.log('✅ Alimentos disponíveis!');
            console.log(`   📊 Total: ${response.data.length} alimentos`);
            
            // Mostra os primeiros 5 alimentos
            console.log('   🥗 Primeiros alimentos:');
            response.data.slice(0, 5).forEach((alimento, index) => {
                console.log(`      ${index + 1}. ${alimento.nome} - ${alimento.energia_kcal}kcal`);
            });

            if (response.data.length >= 10) {
                console.log('   ✅ Dados suficientes para o app Flutter!');
            } else {
                console.log('   ⚠️  Poucos alimentos cadastrados');
            }
        } else {
            console.log('❌ Falha ao buscar alimentos - resposta inválida');
        }
    } catch (error) {
        console.log('❌ Erro ao buscar alimentos:', error.response?.data?.message || error.message);
    }

    // Teste 4: Buscar alimentos com filtro
    try {
        console.log('\n4️⃣ Testando busca de alimentos com FILTRO...');
        const response = await axios.get(`${baseURL}/alimentos?search=arroz`);

        if (response.data && Array.isArray(response.data)) {
            console.log('✅ Busca com filtro funcionando!');
            console.log(`   📊 Encontrados: ${response.data.length} alimentos com "arroz"`);
            
            response.data.slice(0, 3).forEach((alimento, index) => {
                console.log(`      ${index + 1}. ${alimento.nome}`);
            });
        }
    } catch (error) {
        console.log('❌ Erro na busca filtrada:', error.response?.data?.message || error.message);
    }

    // Teste 5: Testar endpoint de pacientes (com autenticação)
    if (nutriToken) {
        try {
            console.log('\n5️⃣ Testando endpoint de PACIENTES (autenticado)...');
            const response = await axios.get(`${baseURL}/pacientes`, {
                headers: {
                    'Authorization': `Bearer ${nutriToken}`
                }
            });

            if (response.data && Array.isArray(response.data)) {
                console.log('✅ Endpoint de pacientes OK!');
                console.log(`   📊 Total pacientes: ${response.data.length}`);
            } else {
                console.log('❌ Resposta inválida do endpoint pacientes');
            }
        } catch (error) {
            console.log('❌ Erro no endpoint pacientes:', error.response?.data?.message || error.message);
        }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📱 RESUMO PARA O FLUTTER APP');
    console.log('='.repeat(60));
    console.log('🔑 CREDENCIAIS PARA TESTAR:');
    console.log(`   👨‍⚕️ Nutricionista: ${credenciais.nutricionista.email} / ${credenciais.nutricionista.senha}`);
    console.log(`   👤 Paciente: ${credenciais.paciente.email} / ${credenciais.paciente.senha}`);
    console.log('');
    console.log('🔗 ENDPOINTS DISPONÍVEIS:');
    console.log(`   📡 Login Nutri: POST ${baseURL}/auth/login-nutri`);
    console.log(`   📡 Login Paciente: POST ${baseURL}/auth/login-paciente`);
    console.log(`   📡 Alimentos: GET ${baseURL}/alimentos`);
    console.log(`   📡 Buscar: GET ${baseURL}/alimentos?search=termo`);
    console.log(`   📡 Pacientes: GET ${baseURL}/pacientes (autenticado)`);
    console.log('');
    
    const status = nutriToken && pacienteToken ? '✅ TUDO FUNCIONANDO!' : '⚠️  ALGUNS PROBLEMAS ENCONTRADOS';
    console.log(`🎯 STATUS: ${status}`);
    console.log('='.repeat(60));
}

// Executa o teste
if (require.main === module) {
    testForFlutter().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = testForFlutter;
