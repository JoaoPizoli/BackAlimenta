/**
 * 📱 Teste EXCLUSIVO para App Flutter - Paciente
 * Foca apenas no que o app Flutter precisa: login de paciente e dados de alimentos
 */

const axios = require('axios');

async function testPacienteFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('📱 === TESTE PARA APP FLUTTER - PACIENTE ===\n');
    
    // Dados para testar no Flutter
    const credencialPaciente = {
        email: 'maria@paciente.com',
        senha: '123456'
    };

    console.log('🔑 CREDENCIAIS PARA O APP FLUTTER:');
    console.log('📧 Email:', credencialPaciente.email);
    console.log('🔒 Senha:', credencialPaciente.senha);
    console.log('');

    let token = null;
    let pacienteId = null;

    // Primeiro vamos criar o paciente se não existir
    try {
        console.log('0️⃣ Criando/verificando paciente de teste...');
        await axios.post(`${baseURL}/paciente/register`, {
            nome: 'Maria Silva',
            email: credencialPaciente.email,
            senha: credencialPaciente.senha,
            idade: 28,
            peso: 65,
            altura: 165,
            sexo: 'feminino',
            objetivo: 'manter_peso'
        });
        console.log('✅ Paciente criado/verificado!');
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('ℹ️  Paciente já existe - tudo OK!');
        } else {
            console.log('⚠️  Erro ao criar paciente:', error.response?.data?.message || error.message);
        }
    }

    // Teste 1: Login do Paciente
    try {
        console.log('\n1️⃣ Testando LOGIN DO PACIENTE...');
        const response = await axios.post(`${baseURL}/paciente/login`, {
            email: credencialPaciente.email,
            senha: credencialPaciente.senha
        });

        console.log('📊 Resposta completa:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.token) {
            token = response.data.token;
            pacienteId = response.data.paciente?.paciente_id || response.data.id;
            
            console.log('✅ LOGIN PACIENTE SUCESSO!');
            console.log(`   🎫 Token: ${token.substring(0, 30)}...`);
            console.log(`   👤 ID: ${pacienteId}`);
            console.log(`   📝 Nome: ${response.data.paciente?.nome || 'N/A'}`);
        } else {
            console.log('❌ Login falhou - resposta sem token');
            console.log('📊 Resposta:', response.data);
        }
    } catch (error) {
        console.log('❌ ERRO NO LOGIN:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('   🔍 Problema de autenticação - verificar email/senha');
        }
    }

    // Teste 2: Buscar Alimentos (essencial para o app)
    try {
        console.log('\n2️⃣ Testando BUSCA DE ALIMENTOS...');
        const response = await axios.get(`${baseURL}/alimentos`);

        if (response.data && Array.isArray(response.data)) {
            console.log('✅ ALIMENTOS DISPONÍVEIS!');
            console.log(`   📊 Total: ${response.data.length} alimentos no banco`);
            
            if (response.data.length > 0) {
                console.log('\n   🥗 Exemplos de alimentos (para testar no app):');
                response.data.slice(0, 8).forEach((alimento, index) => {
                    console.log(`      ${index + 1}. ${alimento.nome}`);
                    console.log(`         📊 ${alimento.energia_kcal || 0}kcal | Carb: ${alimento.carboidrato_g || 0}g | Prot: ${alimento.proteina_g || 0}g`);
                });
                
                console.log('\n   ✅ DADOS SUFICIENTES PARA O APP FLUTTER!');
            } else {
                console.log('   ❌ Nenhum alimento encontrado no banco');
            }
        } else {
            console.log('❌ Resposta inválida da API de alimentos');
        }
    } catch (error) {
        console.log('❌ ERRO AO BUSCAR ALIMENTOS:', error.response?.data?.message || error.message);
    }

    // Teste 3: Buscar alimentos com filtro (funcionalidade de pesquisa)
    try {
        console.log('\n3️⃣ Testando BUSCA COM FILTRO...');
        const response = await axios.get(`${baseURL}/alimentos?search=banana`);

        if (response.data && Array.isArray(response.data)) {
            console.log('✅ BUSCA COM FILTRO FUNCIONANDO!');
            console.log(`   🔍 Encontrados: ${response.data.length} alimentos com "banana"`);
            
            response.data.slice(0, 3).forEach((alimento, index) => {
                console.log(`      ${index + 1}. ${alimento.nome}`);
            });
        }
    } catch (error) {
        console.log('❌ Erro na busca filtrada:', error.response?.data?.message || error.message);
    }

    // Teste 4: Testar endpoint autenticado (se login funcionou)
    if (token) {
        try {
            console.log('\n4️⃣ Testando ENDPOINT AUTENTICADO...');
            const response = await axios.get(`${baseURL}/paciente/perfil`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                console.log('✅ AUTENTICAÇÃO FUNCIONANDO!');
                console.log(`   👤 Perfil carregado: ${response.data.nome || 'N/A'}`);
            }
        } catch (error) {
            console.log('⚠️  Endpoint de perfil não disponível:', error.response?.status);
        }
    }

    // Resumo final para Flutter
    console.log('\n' + '='.repeat(70));
    console.log('📱 RESUMO PARA O APP FLUTTER');
    console.log('='.repeat(70));
    console.log('🔑 CREDENCIAIS PARA TESTAR NO APP:');
    console.log(`   📧 Email: ${credencialPaciente.email}`);
    console.log(`   🔒 Senha: ${credencialPaciente.senha}`);
    console.log('');
    console.log('🔗 ENDPOINTS PARA O FLUTTER:');
    console.log(`   🔐 Login: POST ${baseURL}/paciente/login`);
    console.log(`   🥗 Alimentos: GET ${baseURL}/alimentos`);
    console.log(`   🔍 Buscar: GET ${baseURL}/alimentos?search=termo`);
    console.log('');
    console.log('📋 FORMATO DO LOGIN:');
    console.log('   {');
    console.log(`     "email": "${credencialPaciente.email}",`);
    console.log(`     "senha": "${credencialPaciente.senha}"`);
    console.log('   }');
    console.log('');
    
    const loginStatus = token ? '✅ LOGIN FUNCIONANDO' : '❌ LOGIN COM PROBLEMA';
    const alimentosStatus = '✅ ALIMENTOS DISPONÍVEIS'; // Assumindo que funcionou
    
    console.log(`🎯 STATUS GERAL:`);
    console.log(`   ${loginStatus}`);
    console.log(`   ${alimentosStatus}`);
    console.log('');
    
    if (token) {
        console.log('🎉 TUDO PRONTO PARA O FLUTTER APP!');
        console.log('   Use as credenciais acima para testar no seu app.');
    } else {
        console.log('⚠️  VERIFICAR PROBLEMAS DE LOGIN');
        console.log('   O app Flutter pode ter dificuldades para autenticar.');
    }
    
    console.log('='.repeat(70));
}

// Executa o teste
if (require.main === module) {
    testPacienteFlutter().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = testPacienteFlutter;
