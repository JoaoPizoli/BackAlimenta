const axios = require('axios');

async function testarNutricionistaComPacientes() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('👩‍⚕️ === TESTE COMPLETO: LOGIN + PACIENTES ===\n');
    
    let nutriToken = null;
    let nutriId = null;
    
    // 1. Fazer login do nutricionista
    try {
        console.log('1️⃣ Fazendo login da nutricionista...');
        const loginResponse = await axios.post(`${baseURL}/nutri/login`, {
            email: 'admin@admin.com',
            senha: 'admin123'
        });
        
        console.log('📡 Resposta completa do login:');
        console.log(JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.status && loginResponse.data.token) {
            nutriToken = loginResponse.data.token;
            nutriId = loginResponse.data.nutri.nutri_id;
            
            console.log('\n✅ Login nutricionista OK!');
            console.log(`   🎫 Token: ${nutriToken.substring(0, 30)}...`);
            console.log(`   👩‍⚕️ ID: ${nutriId}`);
            console.log(`   📝 Nome: ${loginResponse.data.nutri.nome}`);
        } else {
            console.log('❌ Falha no login - Token não encontrado');
            console.log('📋 Dados disponíveis:', Object.keys(loginResponse.data));
            return;
        }
        
    } catch (error) {
        console.log('❌ Erro no login da nutricionista:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Dados:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Erro:', error.message);
        }
        return;
    }
    
    // 2. Listar pacientes vinculados
    try {
        console.log('\n2️⃣ Buscando pacientes vinculados...');
        
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
                console.log('\n⚠️  Nenhum paciente vinculado a esta nutricionista');
                console.log('💡 Vamos criar um paciente de teste...');
                
                // Criar paciente de teste
                const novoPaciente = {
                    nome: 'Paciente Teste',
                    email: 'paciente.teste@email.com',
                    senha: '123456',
                    telefone: '11999887766',
                    peso: 70,
                    nutri_id: nutriId
                };
                
                try {
                    const cadastroResponse = await axios.post(`${baseURL}/paciente/register`, novoPaciente, {
                        headers: {
                            'Authorization': `Bearer ${nutriToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('📝 Resultado do cadastro:');
                    console.log(JSON.stringify(cadastroResponse.data, null, 2));
                    
                    if (cadastroResponse.data.status) {
                        console.log('✅ Paciente de teste criado com sucesso!');
                        
                        // Buscar novamente os pacientes
                        console.log('\n3️⃣ Buscando pacientes novamente...');
                        const novaPesquisa = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
                            headers: {
                                'Authorization': `Bearer ${nutriToken}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log('📊 PACIENTES APÓS CADASTRO:');
                        console.log(JSON.stringify(novaPesquisa.data, null, 2));
                        
                        if (novaPesquisa.data.pacientes && novaPesquisa.data.pacientes.length > 0) {
                            console.log(`\n🎉 Agora temos ${novaPesquisa.data.pacientes.length} paciente(s)!`);
                        }
                    } else {
                        console.log('❌ Falha ao criar paciente de teste');
                    }
                } catch (cadastroError) {
                    console.log('❌ Erro ao cadastrar paciente:', cadastroError.response?.data || cadastroError.message);
                }
                
            } else {
                pacientes.forEach((paciente, index) => {
                    console.log(`\n   ${index + 1}. 📋 ${paciente.nome}`);
                    console.log(`      📧 ${paciente.email}`);
                    console.log(`      📱 ${paciente.telefone || 'Sem telefone'}`);
                    console.log(`      ⚡ Status: ${paciente.ativo ? 'Ativo' : 'Inativo'}`);
                    console.log(`      📅 Criado: ${paciente.data_criacao || 'Data não informada'}`);
                });
                
                console.log('\n🎉 Sistema funcionando perfeitamente!');
                console.log('✅ Login da nutricionista realizado');
                console.log('✅ Pacientes carregados com sucesso');
            }
        } else {
            console.log('❌ Resposta inválida ao buscar pacientes');
            console.log('📋 Status:', pacientesResponse.data.status);
            console.log('📋 Mensagem:', pacientesResponse.data.message);
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar pacientes:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Dados:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Erro:', error.message);
        }
    }
    
    console.log('\n🏁 Teste finalizado!');
}

// Executar o teste
testarNutricionistaComPacientes().catch(console.error);
