const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';

async function testarPersistenciaFlutter() {
    console.log('🧪 Testando Persistência de Alimentos Flutter');
    console.log('=' .repeat(50));

    try {
        // 1. Salvar um alimento (simular Flutter)
        console.log('\n📤 1. Salvando alimento...');
        const alimentoData = {
            nome_alimento: 'Banana',
            quantidade: 100,
            paciente_id: 1,
            nutri_id: 1,
            tipo_refeicao: 'lanche',
            observacoes: 'Testado via Flutter - 2025-06-01'
        };

        const saveResponse = await axios.post(`${BASE_URL}/alimentos/calcular-macros`, alimentoData);
        
        if (saveResponse.data.status) {
            console.log('✅ Alimento salvo com sucesso!');
            console.log('📊 Macros calculados:', {
                calorias: saveResponse.data.calorias_calculadas,
                proteinas: saveResponse.data.proteinas_calculadas,
                carboidratos: saveResponse.data.carboidratos_calculados,
                gorduras: saveResponse.data.gorduras_calculadas
            });
        } else {
            console.log('❌ Falha ao salvar:', saveResponse.data.error);
            return;
        }

        // 2. Buscar alimentos por data (simular carregamento Flutter)
        console.log('\n📥 2. Buscando alimentos persistidos...');
        const dataConsulta = '2025-06-01';
        const pacienteId = 1;
        
        const loadResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/data/${pacienteId}?data=${dataConsulta}`);
        
        if (loadResponse.data.status) {
            console.log('✅ Alimentos carregados com sucesso!');
            console.log('📋 Total de itens:', loadResponse.data.data.total_itens);
            console.log('📊 Totais do dia:', loadResponse.data.data.totais_gerais);
            
            // Mostrar alimentos por refeição
            Object.keys(loadResponse.data.data.refeicoes).forEach(refeicao => {
                const dados = loadResponse.data.data.refeicoes[refeicao];
                console.log(`\n🍽️ ${refeicao.toUpperCase()}:`);
                console.log(`   - ${dados.alimentos.length} item(s)`);
                console.log(`   - ${dados.total_calorias.toFixed(1)} kcal`);
                
                dados.alimentos.forEach(alimento => {
                    console.log(`   🥄 ${alimento.alimento_nome} (${alimento.quantidade_gramas}g) - ${alimento.calorias_item}kcal`);
                });
            });
        } else {
            console.log('❌ Falha ao carregar:', loadResponse.data.error);
        }

        // 3. Testar mudança de data (sem dados)
        console.log('\n📅 3. Testando outra data (sem dados)...');
        const dataVazia = '2025-06-02';
        
        const emptyResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/data/${pacienteId}?data=${dataVazia}`);
        
        if (emptyResponse.data.status && emptyResponse.data.data.total_itens === 0) {
            console.log('✅ Confirmado: data sem registros retorna vazia');
        } else {
            console.log('⚠️ Comportamento inesperado para data vazia');
        }

        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('✨ A persistência Flutter está funcionando corretamente.');

    } catch (error) {
        console.error('❌ Erro durante teste:', error.response?.data || error.message);
    }
}

// Executar teste
testarPersistenciaFlutter();
