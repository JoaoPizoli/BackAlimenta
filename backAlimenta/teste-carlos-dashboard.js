const axios = require('axios');

async function testarLoginCarlos() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('👨‍⚕️ === TESTE: LOGIN CARLOS + LISTAR PACIENTES ===\n');
    
    let nutriToken = null;
    let nutriId = null;
    
    // 1. Fazer login do Carlos
    try {
        console.log('1️⃣ Fazendo login do Carlos...');
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        if (loginResponse.data.status && loginResponse.data.token) {
            nutriToken = loginResponse.data.token;
            nutriId = loginResponse.data.nutri.nutri_id;
            
            console.log('✅ Login Carlos OK!');
            console.log(`   🎫 Token: ${nutriToken.substring(0, 30)}...`);
            console.log(`   👨‍⚕️ ID: ${nutriId}`);
            console.log(`   📝 Nome: ${loginResponse.data.nutri.nome}`);
        } else {
            console.log('❌ Falha no login - sem token');
            console.log('📄 Resposta completa:', JSON.stringify(loginResponse.data, null, 2));
            return;
        }
        
    } catch (error) {
        console.log('❌ Erro no login do Carlos:', error.response?.data || error.message);
        return;
    }
    
    // 2. Listar pacientes vinculados ao Carlos
    try {
        console.log('\n2️⃣ Buscando pacientes vinculados ao Carlos...');
        const pacientesResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
            headers: {
                'Authorization': `Bearer ${nutriToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 RESPOSTA DOS PACIENTES:');
        console.log(JSON.stringify(pacientesResponse.data, null, 2));
        
        if (pacientesResponse.data.status && pacientesResponse.data.pacientes) {
            const pacientes = pacientesResponse.data.pacientes;
            
            console.log(`\n✅ ${pacientes.length} paciente(s) encontrado(s):`);
            
            if (pacientes.length === 0) {
                console.log('⚠️  Nenhum paciente vinculado ao Carlos');
                console.log('💡 Vamos criar um paciente de teste...');
                
                // Criar paciente de teste vinculado ao Carlos
                try {
                    const novoPaciente = {
                        nome: 'João Silva',
                        email: 'joao.silva@teste.com',
                        senha: '123456',
                        telefone: '11999887766',
                        peso: 75,
                        nutri_id: nutriId
                    };
                    
                    console.log('\n3️⃣ Criando paciente de teste...');
                    const criarResponse = await axios.post(`${baseURL}/paciente/register`, novoPaciente);
                    
                    console.log('📊 RESPOSTA DA CRIAÇÃO:');
                    console.log(JSON.stringify(criarResponse.data, null, 2));
                    
                    if (criarResponse.data.status) {
                        console.log('✅ Paciente criado com sucesso!');
                        
                        // Buscar novamente os pacientes
                        console.log('\n4️⃣ Buscando pacientes novamente...');
                        const pacientesResponse2 = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
                            headers: {
                                'Authorization': `Bearer ${nutriToken}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log('📊 PACIENTES APÓS CRIAÇÃO:');
                        console.log(JSON.stringify(pacientesResponse2.data, null, 2));
                        
                    } else {
                        console.log('❌ Erro ao criar paciente:', criarResponse.data.message || criarResponse.data.error);
                    }
                    
                } catch (createError) {
                    console.log('❌ Erro ao criar paciente:', createError.response?.data || createError.message);
                }
                
            } else {
                pacientes.forEach((paciente, index) => {
                    console.log(`\n📋 Paciente ${index + 1}:`);
                    console.log(`   👤 Nome: ${paciente.nome}`);
                    console.log(`   📧 Email: ${paciente.email}`);
                    console.log(`   📱 Telefone: ${paciente.telefone || 'Não informado'}`);
                    console.log(`   💪 Ativo: ${paciente.ativo ? 'Sim' : 'Não'}`);
                    console.log(`   📅 Criado em: ${paciente.data_criacao}`);
                });
            }
            
        } else {
            console.log('❌ Falha ao buscar pacientes');
            console.log('📄 Resposta completa:', JSON.stringify(pacientesResponse.data, null, 2));
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar pacientes:', error.response?.data || error.message);
    }
    
    console.log('\n🎯 === TESTE CONCLUÍDO ===');
}

// Executar o teste
testarLoginCarlos().catch(console.error);
