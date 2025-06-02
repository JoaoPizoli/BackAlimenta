const axios = require('axios');

async function testarBuscarPacientes() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔐 Fazendo login...');
    
    try {
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        if (loginResponse.data.status && loginResponse.data.token) {
            const nutriId = loginResponse.data.nutri.nutri_id;
            const token = loginResponse.data.token;
            
            console.log('✅ Login OK! Buscando pacientes...');
            
            const pacientesResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Resposta completa dos pacientes:');
            console.log(JSON.stringify(pacientesResponse.data, null, 2));
            
            if (pacientesResponse.data.status && pacientesResponse.data.pacientes) {
                const pacientes = pacientesResponse.data.pacientes;
                console.log('\n🔍 Análise dos IDs dos pacientes:');
                
                pacientes.forEach((p, index) => {
                    console.log(`Paciente ${index + 1}:`);
                    console.log(`  - ID: ${p.paciente_id} (tipo: ${typeof p.paciente_id})`);
                    console.log(`  - Nome: ${p.nome}`);
                    console.log(`  - Email: ${p.email}`);
                });
                
                // Simular busca por ID
                const primeiroId = pacientes[0].paciente_id;
                console.log(`\n🎯 Testando busca pelo primeiro ID: ${primeiroId}`);
                console.log(`Tipo do ID: ${typeof primeiroId}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

testarBuscarPacientes();
