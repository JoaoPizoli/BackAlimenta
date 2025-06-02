const axios = require('axios');

async function testarCriacaoPaciente() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🧪 === TESTE: CRIAR NOVO PACIENTE ===\n');
    
    // 1. Fazer login do nutricionista
    try {
        console.log('🔐 Fazendo login da nutricionista...');
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        if (!loginResponse.data.status || !loginResponse.data.token) {
            console.log('❌ Falha no login');
            return;
        }
        
        const nutriId = loginResponse.data.nutri.nutri_id;
        const token = loginResponse.data.token;
        console.log('✅ Login OK! Nutri ID:', nutriId);
        
        // 2. Criar novo paciente
        const novoPaciente = {
            nome: 'João Silva Teste',
            email: 'joao.teste@email.com',
            senha: 'senha123',
            telefone: '11999887766',
            peso: 75,
            nutri_id: nutriId
        };
        
        console.log('\n➕ Criando novo paciente:', novoPaciente);
        
        const criarResponse = await axios.post(`${baseURL}/paciente/register`, novoPaciente, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Resposta da criação:', criarResponse.data);
        
        if (criarResponse.data.status) {
            console.log('✅ Paciente criado com sucesso!');
            
            // 3. Verificar se aparece na lista
            console.log('\n📋 Verificando lista de pacientes...');
            const pacientesResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('👥 Pacientes encontrados:', pacientesResponse.data.pacientes?.length || 0);
            pacientesResponse.data.pacientes?.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.nome} (${p.email})`);
            });
            
        } else {
            console.log('❌ Erro ao criar paciente:', criarResponse.data.message || criarResponse.data.error);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

testarCriacaoPaciente();
