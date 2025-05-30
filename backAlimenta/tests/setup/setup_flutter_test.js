const knex = require('./src/database/connection');

async function setupFlutterTest() {
    try {
        console.log('🚀 Configurando dados para teste do Flutter...\n');

        // 0. Criar tabela registro_diario se não existir (caso não tenha sido criada na AWS)
        console.log('🗃️ Verificando tabela registro_diario...');
        await knex.raw(`
            CREATE TABLE IF NOT EXISTS registro_diario (
                paciente_id INT NOT NULL,
                data_registro DATE NOT NULL,
                proteina_total DECIMAL(8,2) DEFAULT 0,
                carboidrato_total DECIMAL(8,2) DEFAULT 0,
                gordura_total DECIMAL(8,2) DEFAULT 0,
                calorias_total DECIMAL(8,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (paciente_id, data_registro),
                FOREIGN KEY (paciente_id) REFERENCES paciente(paciente_id) ON DELETE CASCADE,
                INDEX idx_registro_data (data_registro),
                INDEX idx_registro_paciente_data (paciente_id, data_registro)
            );
        `);
        console.log('✅ Tabela registro_diario OK\n');

        // 1. Limpar dados antigos
        console.log('🧹 Limpando dados antigos...');
        await knex('registro_diario').del();
        await knex('dieta').del();
        await knex('paciente').del();
        await knex('nutri').del();
        console.log('✅ Dados limpos\n');        // 2. Criar nutricionista (usar nutri_id como na AWS)
        console.log('👨‍⚕️ Criando nutricionista...');
        const [nutri_id] = await knex('nutri').insert({
            nome: 'Dr. Ana Silva',
            email: 'ana@nutri.com', 
            senha: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
            telefone: '(11) 99999-9999'
        });
        console.log(`✅ Nutricionista criada (ID: ${nutri_id})\n`);

        // 3. Criar paciente (usar paciente_id como na AWS)
        console.log('👤 Criando paciente...');
        const [paciente_id] = await knex('paciente').insert({
            nome: 'João Silva',
            email: 'joao@paciente.com',
            senha: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
            telefone: '(11) 88888-8888',
            peso: 75.5,
            nutri_id: nutri_id,
            ativo: true
        });
        console.log(`✅ Paciente criado (ID: ${paciente_id})\n`);        // 4. Criar meta diária para o paciente (sem campo 'ativo' - não existe na AWS)
        console.log('🎯 Criando meta diária...');
        const hoje = new Date().toISOString().split('T')[0];
        await knex('dieta').insert({
            proteina: 120.0,  // 120g de proteína
            carbo: 300.0,     // 300g de carboidrato  
            gordura: 80.0,    // 80g de gordura
            calorias: 2200.0, // 2200 kcal total
            paciente_id: paciente_id,
            nutri_id: nutri_id,
            data: hoje
        });
        console.log(`✅ Meta criada para ${hoje}:`);
        console.log(`   🥩 Proteína: 120g`);
        console.log(`   🍞 Carboidrato: 300g`);
        console.log(`   🥑 Gordura: 80g`);
        console.log(`   🔥 Calorias: 2200 kcal\n`);

        // 5. NÃO criar registro diário - deixar zerado para o Flutter testar
        console.log('📊 Deixando registro diário vazio para testes...');
        console.log('✅ Paciente começará com 0g/0g/0g/0kcal consumidos\n');        // 6. Verificar configuração (usar nutri_id e paciente_id como na AWS)
        console.log('🔍 Verificando configuração final...');
        const nutri = await knex('nutri').where('nutri_id', nutri_id).first();
        const paciente = await knex('paciente').where('paciente_id', paciente_id).first();
        const meta = await knex('dieta').where('paciente_id', paciente_id).first();
        const registro = await knex('registro_diario').where('paciente_id', paciente_id).first();

        console.log('\n📋 RESUMO DA CONFIGURAÇÃO:');
        console.log('================================');
        console.log(`👨‍⚕️ Nutricionista: ${nutri.nome} (${nutri.email})`);
        console.log(`👤 Paciente: ${paciente.nome} (${paciente.email})`);
        console.log(`🎯 Meta definida: ✅`);
        console.log(`📊 Registro diário: ${registro ? '❌ EXISTE (deve estar vazio)' : '✅ VAZIO (perfeito para teste)'}`);
        
        console.log('\n🔑 CREDENCIAIS PARA TESTE NO FLUTTER:');
        console.log('=====================================');
        console.log(`📧 Email do paciente: joao@paciente.com`);
        console.log(`🔐 Senha do paciente: password`);
        console.log(`🆔 ID do paciente: ${paciente_id}`);
        
        console.log('\n🎯 METAS CONFIGURADAS:');
        console.log('======================');
        console.log(`🥩 Proteína: ${meta.proteina}g`);
        console.log(`🍞 Carboidrato: ${meta.carbo}g`);
        console.log(`🥑 Gordura: ${meta.gordura}g`);
        console.log(`🔥 Calorias: ${meta.calorias} kcal`);

        console.log('\n✅ CONFIGURAÇÃO COMPLETA!');
        console.log('Agora você pode testar no Flutter:');
        console.log('1. Fazer login com joao@paciente.com / password');
        console.log('2. Ver as metas carregadas da nutri');
        console.log('3. Registrar alimentos via IA');
        console.log('4. Ver os macros sendo atualizados em tempo real');
        
    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
    } finally {
        knex.destroy();
    }
}

setupFlutterTest();
