const knex = require('./src/database/connection');
const bcrypt = require('bcryptjs');

async function testarPacienteNovo() {
    try {
        console.log('🔍 Testando paciente novo...');
        
        const paciente = await knex('paciente')
            .select(['paciente_id', 'nome', 'email', 'ativo', 'senha'])
            .where({ email: 'joao.teste@email.com' })
            .first();
        
        if (paciente) {
            console.log('✅ Paciente encontrado:');
            console.log('- ID:', paciente.paciente_id);
            console.log('- Nome:', paciente.nome);
            console.log('- Email:', paciente.email);
            console.log('- Ativo:', paciente.ativo);
            
            const senhaCorreta = await bcrypt.compare('123456', paciente.senha);
            console.log('- Senha "123456" é válida:', senhaCorreta);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testarPacienteNovo();
