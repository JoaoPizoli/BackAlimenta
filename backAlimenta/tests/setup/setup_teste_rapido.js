const axios = require('axios');

async function setupTeste() {
    const baseURL = 'http://127.0.0.1:3333';
    
    try {
        console.log('🎯 === SETUP RÁPIDO PARA TESTE ===\n');
        
        // 1. Login do nutricionista existente
        console.log('1️⃣ Fazendo login do nutricionista...');
        const loginNutri = await axios.post(`${baseURL}/auth/login-nutri`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        const nutriToken = loginNutri.data.token;
        const nutriId = loginNutri.data.nutri.nutri_id;
        console.log(`✅ Nutri logado - ID: ${nutriId}`);
        
        // 2. Definir meta para paciente ID 2 (que já existe)
        const pacienteId = 2;
        console.log(`\n2️⃣ Definindo meta para paciente ${pacienteId}...`);
        
        try {
            const metaResp = await axios.post(`${baseURL}/dieta/meta`, {
                proteina: 150,
                carbo: 250,
                gordura: 80,
                calorias: 2200,
                paciente_id: pacienteId,
                nutri_id: nutriId,
                data: '2025-05-26'
            }, {
                headers: { Authorization: `Bearer ${nutriToken}` }
            });
            console.log('✅ Meta definida:', metaResp.data);
        } catch (error) {
            console.log('⚠️ Meta pode já existir:', error.response?.data?.error || error.message);
        }
        
        // 3. Testar login do paciente
        console.log(`\n3️⃣ Testando login do paciente...`);
        const loginPaciente = await axios.post(`${baseURL}/auth/login`, {
            email: 'joao@paciente.com',
            senha: '123456',
            tipo: 'paciente'
        });
        console.log('✅ Paciente logado:', loginPaciente.data);
          // 4. Buscar resumo diário do paciente
        console.log(`\n4️⃣ Buscando resumo diário...`);
        const pacienteToken = loginPaciente.data.token;
        const resumo = await axios.get(`${baseURL}/registro-diario/${pacienteId}/resumo`, {
            headers: { Authorization: `Bearer ${pacienteToken}` }
        });
        console.log('✅ Resumo atual:', resumo.data);
        
        // 5. Testar busca de alimentos
        console.log(`\n5️⃣ Testando alimentos...`);
        const alimentos = await axios.get(`${baseURL}/alimento/search?nome=arroz`, {
            headers: { Authorization: `Bearer ${nutriToken}` }
        });
        console.log('✅ Alimentos encontrados:', alimentos.data.slice(0, 2));
        
        console.log('\n🎉 === DADOS PRONTOS PARA TESTE ===');
        console.log('📱 USAR NO FLUTTER:');
        console.log('   Email: joao@paciente.com');
        console.log('   Senha: 123456');
        console.log(`   Paciente ID: ${pacienteId}`);
        console.log(`   Nutri ID: ${nutriId}`);
        console.log('   Meta: 2200 kcal | 150g proteína | 250g carbo | 80g gordura');
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

setupTeste();
