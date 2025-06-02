const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';

// Teste específico para verificar se macros são atualizados em vez de criar novas linhas
async function testeCorrecaoMacros() {
    console.log('\n🔧 ===== TESTE DE CORREÇÃO DE MACROS =====');
    
    try {
        // 1. Fazer login como admin
        console.log('1️⃣ Fazendo login como admin...');
        const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
            email: 'carlos@nutri.com',
            password: '123456'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Falha no login:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login OK!');

        // Headers para autenticação
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Buscar um paciente para testar
        console.log('\n2️⃣ Buscando pacientes...');
        const patientsResponse = await axios.get(`${BASE_URL}/admin/patients`, { headers });
        
        if (!patientsResponse.data.success || patientsResponse.data.patients.length === 0) {
            console.log('❌ Nenhum paciente encontrado');
            return;
        }

        const paciente = patientsResponse.data.patients[0];
        console.log(`✅ Usando paciente: ${paciente.name} (ID: ${paciente.id})`);

        // 3. Verificar macros atuais do paciente
        console.log('\n3️⃣ Verificando macros atuais...');
        const macrosAntes = await axios.get(`${BASE_URL}/pacientes/${paciente.id}/macros`, { headers });
        console.log('📊 Macros antes:', macrosAntes.data);

        // 4. Contar quantas linhas de dieta existem para este paciente
        console.log('\n4️⃣ Contando linhas na tabela dieta...');
        const contarAntes = await axios.get(`${BASE_URL}/debug/contar-dietas/${paciente.id}`, { headers });
        console.log(`📋 Linhas na tabela dieta ANTES: ${contarAntes.data.count || 'N/A'}`);

        // 5. Definir macros pela primeira vez
        console.log('\n5️⃣ Definindo macros pela primeira vez...');
        const primeiraMacro = {
            calories: 2000,
            proteins: 150,
            carbs: 200,
            fats: 70
        };

        const response1 = await axios.put(`${BASE_URL}/pacientes/${paciente.id}/macros`, primeiraMacro, { headers });
        console.log('📝 Primeira definição:', response1.data);

        // 6. Contar linhas após primeira definição
        const contarApos1 = await axios.get(`${BASE_URL}/debug/contar-dietas/${paciente.id}`, { headers });
        console.log(`📋 Linhas na tabela dieta APÓS 1ª definição: ${contarApos1.data.count || 'N/A'}`);

        // 7. Atualizar macros (deve fazer UPDATE, não INSERT)
        console.log('\n7️⃣ Atualizando macros (deve fazer UPDATE)...');
        const segundaMacro = {
            calories: 2200,
            proteins: 160,
            carbs: 220,
            fats: 75
        };

        const response2 = await axios.put(`${BASE_URL}/pacientes/${paciente.id}/macros`, segundaMacro, { headers });
        console.log('📝 Segunda definição (atualização):', response2.data);

        // 8. Contar linhas após atualização
        const contarApos2 = await axios.get(`${BASE_URL}/debug/contar-dietas/${paciente.id}`, { headers });
        console.log(`📋 Linhas na tabela dieta APÓS atualização: ${contarApos2.data.count || 'N/A'}`);

        // 9. Verificar macros finais
        console.log('\n9️⃣ Verificando macros finais...');
        const macrosDepois = await axios.get(`${BASE_URL}/pacientes/${paciente.id}/macros`, { headers });
        console.log('📊 Macros depois:', macrosDepois.data);

        // 10. Validar o resultado
        console.log('\n🎯 ===== RESULTADO DO TESTE =====');
        
        const linhesAntes = contarAntes.data.count || 0;
        const linhasApos1 = contarApos1.data.count || 0;
        const linhasApos2 = contarApos2.data.count || 0;

        console.log(`📋 Linhas antes: ${linhesAntes}`);
        console.log(`📋 Linhas após 1ª definição: ${linhasApos1}`);
        console.log(`📋 Linhas após atualização: ${linhasApos2}`);

        if (linhasApos1 === linhasApos2) {
            console.log('✅ SUCESSO! A atualização fez UPDATE em vez de criar nova linha');
            
            // Verificar se os valores foram atualizados corretamente
            if (macrosDepois.data.macros && 
                macrosDepois.data.macros.calories === segundaMacro.calories &&
                macrosDepois.data.macros.proteins === segundaMacro.proteins) {
                console.log('✅ SUCESSO! Os valores foram atualizados corretamente');
            } else {
                console.log('⚠️ ATENÇÃO! Os valores não foram atualizados corretamente');
            }
        } else {
            console.log('❌ FALHA! A atualização criou uma nova linha em vez de fazer UPDATE');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

// Executar o teste
if (require.main === module) {
    testeCorrecaoMacros().catch(console.error);
}

module.exports = { testeCorrecaoMacros };
