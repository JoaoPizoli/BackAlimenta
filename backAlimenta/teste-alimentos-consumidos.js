const axios = require('axios');

async function testarAlimentosConsumidos() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🍽️ === TESTE: ALIMENTOS CONSUMIDOS ===\n');
    
    try {
        // 1. Login
        console.log('1️⃣ Fazendo login...');
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        const nutriId = loginResponse.data.nutri.nutri_id;
        const token = loginResponse.data.token;
        
        console.log('✅ Login OK!');
        
        // 2. Buscar pacientes
        console.log('2️⃣ Buscando pacientes...');
        const pacientesResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (pacientesResponse.data.pacientes && pacientesResponse.data.pacientes.length > 0) {
            const paciente = pacientesResponse.data.pacientes[0];
            const pacienteId = paciente.paciente_id;
            
            console.log(`✅ Paciente encontrado: ${paciente.nome} (ID: ${pacienteId})`);
            
            // 3. Buscar alimentos do paciente
            console.log('3️⃣ Buscando alimentos consumidos...');
            const hoje = new Date().toISOString().split('T')[0];
            
            const alimentosResponse = await axios.get(`${baseURL}/alimentos-detalhados/data/${pacienteId}?data=${hoje}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('📡 Resposta dos alimentos:', JSON.stringify(alimentosResponse.data, null, 2));
            
            if (alimentosResponse.data.status && alimentosResponse.data.refeicoes) {
                const refeicoes = alimentosResponse.data.refeicoes;
                let totalAlimentos = 0;
                
                Object.keys(refeicoes).forEach(tipoRefeicao => {
                    const alimentos = refeicoes[tipoRefeicao];
                    totalAlimentos += alimentos.length;
                    
                    console.log(`\n🍽️ ${tipoRefeicao.toUpperCase()} (${alimentos.length} itens):`);
                    alimentos.forEach(alimento => {
                        console.log(`   - ${alimento.nome_alimento} (${alimento.quantidade_g}g)`);
                        console.log(`     📊 Cal: ${Math.round(alimento.calorias)}kcal | Prot: ${Math.round(alimento.proteina)}g | Carb: ${Math.round(alimento.carboidrato)}g | Gord: ${Math.round(alimento.lipidio)}g`);
                    });
                });
                
                console.log(`\n✅ Total: ${totalAlimentos} alimento(s) encontrado(s) para hoje`);
                
                if (totalAlimentos === 0) {
                    console.log('\n💡 Dica: Você pode adicionar alimentos usando o app Flutter ou criar dados de teste');
                }
            } else {
                console.log('⚠️ Nenhum alimento encontrado ou erro na resposta');
            }
            
        } else {
            console.log('❌ Nenhum paciente encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testarAlimentosConsumidos();
