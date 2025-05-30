const axios = require('axios');

async function criarDadosTesteAWS() {
    const baseURL = 'http://127.0.0.1:3333';
    
    try {
        console.log('🍎 === CRIANDO DADOS DE TESTE NO AWS ===');
        
        // 1. Criar Nutricionista
        console.log('\n1️⃣ Criando Nutricionista...');
        const nutriResp = await axios.post(`${baseURL}/nutri/register`, {
            nome: 'Dr. Carlos Silva',
            email: 'carlos@nutri.com',
            senha: '123456',
            telefone: '11987654321'
        });
        console.log('✅ Nutricionista criado:', nutriResp.data);
          // 2. Fazer login do nutricionista
        console.log('\n2️⃣ Fazendo login do nutricionista...');
        const loginNutriResp = await axios.post(`${baseURL}/auth/login-nutri`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        const nutriToken = loginNutriResp.data.token;
        const nutriId = loginNutriResp.data.nutri.nutri_id;
        console.log('✅ Login nutri realizado. ID:', nutriId);
        
        // 3. Buscar pacientes existentes do nutricionista
        console.log('\n3️⃣ Buscando pacientes existentes...');
        const pacientesResp = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
            headers: { Authorization: `Bearer ${nutriToken}` }
        });
        
        let pacienteId;
        if (pacientesResp.data.pacientes && pacientesResp.data.pacientes.length > 0) {
            pacienteId = pacientesResp.data.pacientes[0].paciente_id;
            console.log('✅ Usando paciente existente. ID:', pacienteId);
        } else {
            // Criar novo paciente com email único
            console.log('🆕 Criando novo paciente...');
            const timestamp = Date.now();
            const pacienteResp = await axios.post(`${baseURL}/paciente/register`, {
                nome: 'João Silva',
                email: `joao${timestamp}@paciente.com`,
                senha: '123456',
                telefone: '11999888777',
                peso: 80.5,
                altura: 175,
                idade: 30,
                sexo: 'M',
                nutri_id: nutriId
            }, {
                headers: { Authorization: `Bearer ${nutriToken}` }
            });
            pacienteId = pacienteResp.data.paciente?.paciente_id || pacienteResp.data.paciente;
            console.log('✅ Novo paciente criado. ID:', pacienteId);
        }
        
        // 4. Definir metas diárias para o paciente
        console.log('\n4️⃣ Definindo metas diárias...');
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
        console.log('✅ Metas definidas:', metaResp.data);        // 5. Testar busca de alimentos (sem auth)
        console.log('\n5️⃣ Testando busca de alimentos...');
        const alimentosResp = await axios.get(`${baseURL}/alimento/search?nome=arroz`, {
            headers: { Authorization: `Bearer ${nutriToken}` }        });
        
        // Verificar se a resposta tem dados e qual é a estrutura
        console.log('🔍 Resposta completa da API alimentos:', JSON.stringify(alimentosResp.data, null, 2));
        
        let alimentos = [];
        if (alimentosResp.data) {
            if (Array.isArray(alimentosResp.data)) {
                alimentos = alimentosResp.data;
            } else if (alimentosResp.data.alimento) {
                alimentos = Array.isArray(alimentosResp.data.alimento) ? alimentosResp.data.alimento : [alimentosResp.data.alimento];
            } else if (alimentosResp.data.alimentos) {
                alimentos = Array.isArray(alimentosResp.data.alimentos) ? alimentosResp.data.alimentos : [alimentosResp.data.alimentos];
            }
        }
        
        console.log('✅ Alimentos encontrados:', alimentos.slice(0, 3));
          console.log('\n🎉 === DADOS DE TESTE CRIADOS COM SUCESSO ===');
        console.log(`📊 Nutricionista ID: ${nutriId}`);
        console.log(`👤 Paciente ID: ${pacienteId}`);
        console.log(`🔑 Token Nutri: ${nutriToken}`);
        console.log(`📱 Para testar no Flutter use:`);
        console.log(`   Nutricionista: carlos@nutri.com / 123456`);
        console.log(`   Paciente: joao.teste@email.com / 123456 ✅ FUNCIONA`);
        console.log(`⚠️  ATENÇÃO: Use joao.teste@email.com, não joao@paciente.com (senha incompatível)`);
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

criarDadosTesteAWS();
