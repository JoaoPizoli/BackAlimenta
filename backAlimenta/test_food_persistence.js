const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';
const PACIENTE_ID = 1;
const NUTRI_ID = 1;

// Dados de teste
const testFood = {
    nome_alimento: 'Banana',
    quantidade: 100,
    paciente_id: PACIENTE_ID,
    nutri_id: NUTRI_ID,
    tipo_refeicao: 'Café da Manhã',
    observacoes: 'Teste de persistência'
};

async function testFoodPersistence() {
    console.log('🧪 Iniciando teste de persistência de alimentos...\n');

    try {
        // 1. Adicionar alimento via calcular-macros
        console.log('1. ➕ Adicionando alimento via calcular-macros...');
        const addResponse = await axios.post(`${BASE_URL}/alimentos/calcular-macros`, testFood);
        console.log('✅ Alimento adicionado:', addResponse.data);

        // Aguardar um pouco para garantir que foi salvo
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Buscar alimentos detalhados por data
        const today = new Date().toISOString().split('T')[0];
        console.log(`\n2. 🔍 Buscando alimentos detalhados para ${today}...`);
        const detailedResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/data/${PACIENTE_ID}?data=${today}`);
        console.log('✅ Alimentos encontrados:', detailedResponse.data);

        // 3. Buscar alimentos por refeição específica
        console.log(`\n3. 🍽️ Buscando alimentos do Café da Manhã para ${today}...`);
        const mealResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/refeicao/${PACIENTE_ID}?tipo_refeicao=Café da Manhã&data=${today}`);
        console.log('✅ Alimentos do Café da Manhã:', mealResponse.data);

        // 4. Verificar resumo diário
        console.log(`\n4. 📊 Verificando resumo diário para ${today}...`);
        const summaryResponse = await axios.get(`${BASE_URL}/resumo-diario/${PACIENTE_ID}?data=${today}`);
        console.log('✅ Resumo diário:', summaryResponse.data);

        // 5. Testar remoção de alimento detalhado (se houver registros)
        if (detailedResponse.data.data && detailedResponse.data.data.alimentos && detailedResponse.data.data.alimentos.length > 0) {
            const alimentoId = detailedResponse.data.data.alimentos[0].id;
            console.log(`\n5. 🗑️ Removendo alimento detalhado ID ${alimentoId}...`);
            const deleteResponse = await axios.delete(`${BASE_URL}/alimentos-detalhados/${alimentoId}`);
            console.log('✅ Alimento removido:', deleteResponse.data);
        }

        console.log('\n🎉 Teste de persistência concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

// Executar teste
testFoodPersistence();
