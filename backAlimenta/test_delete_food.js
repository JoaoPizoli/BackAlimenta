const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDeleteFood() {
    console.log('🧪 Testando remoção de alimento...\n');
    
    try {
        // 1. Primeiro, adicionar um alimento para depois remover
        console.log('1. ➕ Adicionando alimento para teste...');
        const addResponse = await axios.post(`${BASE_URL}/alimentos/calcular-macros`, {
            paciente_id: 1,
            alimento_nome: "Maçã",
            quantidade: 150,
            tipo_refeicao: "Lanche"
        });
        
        const registroId = addResponse.data.registro_criado.registro_detalhado_id;
        console.log('✅ Alimento adicionado com ID:', registroId);
        
        // 2. Buscar alimentos antes da remoção
        console.log('\n2. 🔍 Verificando alimentos antes da remoção...');
        const beforeResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/data/1`, {
            params: { data: '2025-06-01' }
        });
        console.log('✅ Total de itens antes:', beforeResponse.data.data.total_itens);
        
        // 3. Remover o alimento
        console.log('\n3. ❌ Removendo alimento...');
        const deleteResponse = await axios.delete(`${BASE_URL}/alimentos-detalhados/${registroId}`);
        console.log('✅ Resposta da remoção:', deleteResponse.data);
        
        // 4. Verificar se foi removido
        console.log('\n4. 🔍 Verificando alimentos após remoção...');
        const afterResponse = await axios.get(`${BASE_URL}/alimentos-detalhados/data/1`, {
            params: { data: '2025-06-01' }
        });
        console.log('✅ Total de itens depois:', afterResponse.data.data.total_itens);
        
        console.log('\n🎉 Teste de remoção concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

// Executar teste
testDeleteFood();
