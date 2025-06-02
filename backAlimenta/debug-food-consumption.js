const axios = require('axios');

async function testFoodConsumptionEndpoint() {
    const baseURL = 'http://127.0.0.1:3333';
    
    try {
        console.log('🔐 1. Fazendo login da nutricionista...');
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        const token = loginResponse.data.token;
        const nutriId = loginResponse.data.nutri.nutri_id;
        console.log(`✅ Login realizado! Nutri ID: ${nutriId}`);
        
        console.log('\n🔍 2. Buscando pacientes da nutricionista...');
        const patientsResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`📋 Pacientes encontrados: ${patientsResponse.data.pacientes.length}`);
        
        if (patientsResponse.data.pacientes.length > 0) {
            const paciente = patientsResponse.data.pacientes[0];
            console.log(`👤 Testando com: ${paciente.nome} (ID: ${paciente.paciente_id})`);
            
            // Testar diferentes formatos de data
            const hoje = new Date().toISOString().split('T')[0]; // 2025-06-01
            const datasBrasil = [
                hoje,
                '2025-06-01',
                '01/06/2025',
                '2025-6-1'
            ];
            
            console.log('\n🍽️ 3. Testando busca de alimentos com diferentes formatos de data...');
            
            for (const data of datasBrasil) {
                console.log(`\n📅 Testando data: "${data}"`);
                
                try {
                    // URL que o frontend está usando
                    const url = `${baseURL}/alimentos-detalhados/data/${paciente.paciente_id}?data=${data}`;
                    console.log(`🔗 URL: ${url}`);
                    
                    const foodsResponse = await axios.get(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log(`✅ Resposta (status ${foodsResponse.status}):`);
                    console.log(`   📊 Status API: ${foodsResponse.data.status}`);
                    console.log(`   📝 Items: ${foodsResponse.data.data?.total_itens || 0}`);
                    
                    if (foodsResponse.data.data?.refeicoes) {
                        let totalAlimentos = 0;
                        Object.keys(foodsResponse.data.data.refeicoes).forEach(refeicao => {
                            const qtd = foodsResponse.data.data.refeicoes[refeicao].alimentos?.length || 0;
                            if (qtd > 0) {
                                console.log(`   🍽️ ${refeicao}: ${qtd} alimentos`);
                                totalAlimentos += qtd;
                            }
                        });
                        console.log(`   📊 Total: ${totalAlimentos} alimentos`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
                }
            }
            
            // Testar sem parâmetro de data
            console.log('\n📅 Testando SEM parâmetro de data (hoje)...');
            try {
                const url = `${baseURL}/alimentos-detalhados/data/${paciente.paciente_id}`;
                console.log(`🔗 URL: ${url}`);
                
                const foodsResponse = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log(`✅ Resposta (status ${foodsResponse.status}):`);
                console.log(`   📊 Status API: ${foodsResponse.data.status}`);
                console.log(`   📝 Items: ${foodsResponse.data.data?.total_itens || 0}`);
                
            } catch (error) {
                console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.response?.data || error.message);
    }
}

testFoodConsumptionEndpoint();
