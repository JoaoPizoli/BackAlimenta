const axios = require('axios');
const path = require('path');

async function testLogins() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔐 === TESTANDO LOGINS ===\n');
    
    // Teste 1: Login do nutricionista (deve funcionar)
    try {
        console.log('1️⃣ Testando login do nutricionista...');
        const nutriResult = await axios.post(`${baseURL}/auth/login-nutri`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        console.log('✅ Nutricionista logado com sucesso!');
        console.log('- ID:', nutriResult.data.nutri?.nutri_id);
        console.log('- Status:', nutriResult.data.status);
        console.log('- Token:', nutriResult.data.token ? 'OK' : 'AUSENTE');
    } catch (error) {
        console.log('❌ Erro no login do nutricionista:', error.response?.data || error.message);
    }
    
    console.log('\n');
    
    // Teste 2: Login do paciente (problema relatado)
    try {
        console.log('2️⃣ Testando login do paciente...');
        const pacienteResult = await axios.post(`${baseURL}/auth/login`, {
            email: 'joao@paciente.com',
            senha: '123456',
            tipo: 'paciente'
        });
        console.log('✅ Paciente logado com sucesso!');
        console.log('- ID:', pacienteResult.data.paciente?.paciente_id);
        console.log('- Status:', pacienteResult.data.status);
        console.log('- Token:', pacienteResult.data.token ? 'OK' : 'AUSENTE');
    } catch (error) {
        console.log('❌ Erro no login do paciente:', error.response?.data || error.message);
    }
    
    console.log('\n');
    
    // Teste 3: Verificar dados do paciente no banco
    try {
        console.log('3️⃣ Verificando dados do paciente no banco...');
        const knex = require(path.join(__dirname, '../../src/database/connection'));
        const paciente = await knex('paciente')
            .select(['paciente_id', 'nome', 'email', 'ativo', 'senha'])
            .where({ email: 'joao@paciente.com' })
            .first();
        
        if (paciente) {
            console.log('✅ Paciente encontrado no banco:');
            console.log('- ID:', paciente.paciente_id);
            console.log('- Nome:', paciente.nome);
            console.log('- Email:', paciente.email);
            console.log('- Ativo:', paciente.ativo);
            console.log('- Hash da senha:', paciente.senha.substring(0, 20) + '...');
            
            // Testar se a senha bate
            const bcrypt = require('bcryptjs');
            const senhaCorreta = await bcrypt.compare('123456', paciente.senha);
            console.log('- Senha "123456" é válida:', senhaCorreta);
        } else {
            console.log('❌ Paciente não encontrado no banco!');
        }
    } catch (error) {
        console.log('❌ Erro ao verificar banco:', error.message);
    }
}

testLogins().catch(console.error);
