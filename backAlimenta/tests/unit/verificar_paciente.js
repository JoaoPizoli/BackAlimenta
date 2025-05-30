const knex = require('./src/database/connection');
const bcrypt = require('bcryptjs');

async function verificarPaciente() {
    try {
        console.log('🔍 Verificando paciente no banco...');
        
        const paciente = await knex('paciente')
            .select(['paciente_id', 'nome', 'email', 'ativo', 'senha'])
            .where({ email: 'joao@paciente.com' })
            .first();
        
        if (paciente) {
            console.log('✅ Paciente encontrado:');
            console.log('- ID:', paciente.paciente_id);
            console.log('- Nome:', paciente.nome);
            console.log('- Email:', paciente.email);
            console.log('- Ativo:', paciente.ativo);
            console.log('- Hash da senha:', paciente.senha.substring(0, 30) + '...');
            
            const senhaCorreta = await bcrypt.compare('123456', paciente.senha);
            console.log('- Senha "123456" é válida:', senhaCorreta);
        } else {
            console.log('❌ Paciente não encontrado!');
        }
        
        // Listar todos os pacientes
        console.log('\n📋 Todos os pacientes no banco:');
        const pacientes = await knex('paciente').select(['paciente_id', 'nome', 'email', 'ativo']);
        pacientes.forEach(p => {
            console.log(`- ID: ${p.paciente_id}, Email: ${p.email}, Ativo: ${p.ativo}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

verificarPaciente();
