const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔐 Testando login da nutricionista...');
        
        const response = await axios.post('http://127.0.0.1:3333/nutri/login', {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        console.log('✅ Login realizado com sucesso!');
        console.log('📧 Email:', response.data.nutri.email);
        console.log('👤 Nome:', response.data.nutri.nome);
        console.log('🆔 ID:', response.data.nutri.nutri_id);
        console.log('🔑 Token recebido:', response.data.token ? 'SIM' : 'NÃO');
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Erro no login:', error.response?.data || error.message);
        return null;
    }
}

async function testPatientFoods(token, nutriId) {
    try {
        console.log('\n🍽️ Testando busca de alimentos de pacientes...');
          // Primeiro buscar pacientes
        const patientsResponse = await axios.get(`http://127.0.0.1:3333/nutri/pacientes/${nutriId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📋 Pacientes encontrados:', patientsResponse.data.pacientes.length);
        
        if (patientsResponse.data.pacientes.length > 0) {
            const patient = patientsResponse.data.pacientes[0];
            console.log('👤 Testando com paciente:', patient.nome, '(ID:', patient.paciente_id, ')');
            
            // Buscar alimentos do paciente
            const foodsResponse = await axios.get(`http://127.0.0.1:3333/alimentos-detalhados/data/${patient.paciente_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('🍽️ Resposta da API de alimentos:', JSON.stringify(foodsResponse.data, null, 2));
            
            if (foodsResponse.data.status && foodsResponse.data.data.refeicoes) {
                let totalAlimentos = 0;
                Object.keys(foodsResponse.data.data.refeicoes).forEach(refeicao => {
                    const alimentosRefeicao = foodsResponse.data.data.refeicoes[refeicao].alimentos || [];
                    totalAlimentos += alimentosRefeicao.length;
                    console.log(`🍽️ ${refeicao}: ${alimentosRefeicao.length} alimentos`);
                });
                console.log(`📊 Total de alimentos: ${totalAlimentos}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao buscar alimentos:', error.response?.data || error.message);
    }
}

async function runTest() {
    const loginResult = await testLogin();
    
    if (loginResult && loginResult.token) {
        await testPatientFoods(loginResult.token, loginResult.nutri.nutri_id);
    }
}

runTest();
