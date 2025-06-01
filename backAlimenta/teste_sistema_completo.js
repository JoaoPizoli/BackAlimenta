const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';

// Função para testar busca por transcrição
async function testarBuscaPorTranscricao(textoTranscrito) {
    console.log('\n🧪 ===== TESTE DE BUSCA POR TRANSCRIÇÃO =====');
    console.log(`📝 Texto: "${textoTranscrito}"`);
    console.log('⏳ Processando...\n');
    
    try {
        const startTime = Date.now();
        
        const response = await axios.post(`${BASE_URL}/alimento/buscar-por-transcricao`, {
            texto_transcrito: textoTranscrito,
            limite: 5
        });
        
        const endTime = Date.now();
        const tempoResposta = endTime - startTime;
        
        console.log(`⏱️ Tempo de resposta: ${tempoResposta}ms`);
        console.log(`🤖 IA Agent usado: ${response.data.ia_agent_usado ? '✅' : '❌'}`);
        
        if (response.data.ia_agent_resultado) {
            console.log('🎯 IA Agent extraiu:');
            console.log(`   🥗 Alimento: "${response.data.ia_agent_resultado.alimento_extraido}"`);
            console.log(`   ⚖️ Quantidade: ${response.data.ia_agent_resultado.quantidade_extraida}g`);
            console.log(`   📊 Confiança: ${response.data.ia_agent_resultado.confianca}%`);
        }
        
        console.log(`\n🔍 Resultados encontrados: ${response.data.alimentos?.length || 0}`);
        
        if (response.data.alimentos && response.data.alimentos.length > 0) {
            const primeiro = response.data.alimentos[0];
            console.log('🥇 Primeiro resultado:');
            console.log(`   📛 Nome: ${primeiro.nome}`);
            console.log(`   🔥 Calorias: ${primeiro.calorias}kcal`);
            console.log(`   🥩 Proteína: ${primeiro.proteinas}g`);
            console.log(`   🍞 Carboidratos: ${primeiro.carboidratos}g`);
            console.log(`   🥑 Gordura: ${primeiro.gordura}g`);
            
            if (primeiro.informacoes_calculo) {
                console.log('\n🧮 Informações do cálculo:');
                console.log(`   📏 Quantidade detectada: ${primeiro.informacoes_calculo.quantidade_detectada.quantidade_final}g`);
                console.log(`   📊 Macros originais (100g): ${primeiro.informacoes_calculo.macros_originais.calorias}kcal`);
            }
        }
        
        console.log('\n✅ Teste concluído com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
        return false;
    }
}

// Função para testar busca simples no banco
async function testarBuscaSimples(termo) {
    console.log('\n🧪 ===== TESTE DE BUSCA SIMPLES =====');
    console.log(`🔍 Termo: "${termo}"`);
    
    try {
        const response = await axios.get(`${BASE_URL}/alimento/search/${termo}`);
        
        console.log(`✅ Encontrados: ${response.data.alimentos?.length || 0} alimentos`);
        
        if (response.data.alimentos && response.data.alimentos.length > 0) {
            console.log('📋 Primeiros resultados:');
            response.data.alimentos.slice(0, 3).forEach((alimento, index) => {
                console.log(`   ${index + 1}. ${alimento.nome} (${alimento.calorias}kcal/100g)`);
            });
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na busca:', error.response?.data || error.message);
        return false;
    }
}

// Executar testes
async function executarTodos() {
    console.log('🚀 INICIANDO TESTES DO SISTEMA COMPLETO');
    console.log('=' * 50);
    
    // Lista de testes para executar
    const testesTranscricao = [
        "cinquenta gramas de arroz branco",
        "comi duas bananas hoje",
        "uma fatia de pão francês",
        "cem gramas de frango grelhado",
        "duas colheres de feijão preto",
        "arroz", // teste simples
        "banana" // outro teste simples
    ];
    
    const testesSimples = [
        "arroz",
        "banana", 
        "pão",
        "frango",
        "feijão"
    ];
    
    console.log('\n🧪 ===== TESTANDO BUSCA SIMPLES =====');
    for (const termo of testesSimples) {
        await testarBuscaSimples(termo);
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa de 500ms
    }
    
    console.log('\n🧪 ===== TESTANDO TRANSCRIÇÃO COM IA =====');
    for (const texto of testesTranscricao) {
        await testarBuscaPorTranscricao(texto);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa de 1s
    }
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
}

// Executar se for chamado diretamente
if (require.main === module) {
    executarTodos().catch(console.error);
}

module.exports = {
    testarBuscaPorTranscricao,
    testarBuscaSimples,
    executarTodos
};
