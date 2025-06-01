const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';

// Teste específico para "cinquenta gramas de arroz branco"
async function testeDetalhado() {
    console.log('\n🧪 ===== TESTE DETALHADO: CINQUENTA GRAMAS DE ARROZ BRANCO =====');
    
    try {
        const startTime = Date.now();
        
        const response = await axios.post(`${BASE_URL}/alimento/buscar-por-transcricao`, {
            texto_transcrito: "cinquenta gramas de arroz branco",
            limite: 5
        });
        
        const endTime = Date.now();
        console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
        
        console.log('\n📊 ANÁLISE COMPLETA:');
        console.log('==================');
        
        // Análise da IA Agent
        if (response.data.ia_agent_usado) {
            console.log('🤖 IA Agent: ✅ USADO');
            const iaResult = response.data.ia_agent_resultado;
            console.log(`   🥗 Alimento extraído: "${iaResult.alimento_extraido}"`);
            console.log(`   ⚖️ Quantidade extraída: ${iaResult.quantidade_extraida}g`);
            console.log(`   📊 Confiança: ${iaResult.confianca}%`);
            if (iaResult.observacoes) {
                console.log(`   📝 Observações: ${iaResult.observacoes}`);
            }
        } else {
            console.log('🤖 IA Agent: ❌ NÃO USADO (fallback ativo)');
        }
        
        // Análise da busca
        console.log('\n🔍 BUSCA NO BANCO:');
        const busca = response.data.busca_realizada;
        console.log(`   📝 Texto original: "${busca.texto_original}"`);
        console.log(`   🔄 Texto processado: "${busca.texto_processado}"`);
        console.log(`   🎯 Termo final: "${busca.termo_busca_final}"`);
        console.log(`   🛠️ Método: ${busca.metodo}`);
        
        // Análise dos resultados
        console.log('\n📋 RESULTADOS ENCONTRADOS:');
        if (response.data.alimentos && response.data.alimentos.length > 0) {
            console.log(`   📊 Total: ${response.data.alimentos.length} alimento(s)`);
            
            response.data.alimentos.forEach((alimento, index) => {
                console.log(`\n   ${index + 1}. ${alimento.nome}`);
                console.log(`      📛 ID: ${alimento.id}`);
                console.log(`      🔥 Calorias: ${alimento.calorias}kcal`);
                console.log(`      🥩 Proteína: ${alimento.proteinas}g`);
                console.log(`      🍞 Carboidratos: ${alimento.carboidratos}g`);
                console.log(`      🥑 Gordura: ${alimento.gordura}g`);
                
                if (alimento.informacoes_calculo) {
                    console.log(`      🧮 MACROS CALCULADOS:`);
                    const calc = alimento.informacoes_calculo;
                    console.log(`         📏 Qtd detectada: ${calc.quantidade_detectada.quantidade_final}g`);
                    console.log(`         📊 Original (100g): ${calc.macros_originais.calorias}kcal`);
                    console.log(`         🎯 Calculado (${calc.quantidade_detectada.quantidade_final}g): ${alimento.calorias}kcal`);
                }
                
                if (alimento.categoria) {
                    console.log(`      🏷️ Categoria: ${alimento.categoria}`);
                }
            });
        } else {
            console.log('   ❌ Nenhum alimento encontrado');
        }
        
        console.log('\n✅ TESTE DETALHADO CONCLUÍDO!');
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.response?.data || error.message);
    }
}

// Teste para verificar diferentes formatos de entrada
async function testeMultiplosFormatos() {
    console.log('\n🧪 ===== TESTE MÚLTIPLOS FORMATOS =====');
    
    const testeCases = [
        "cinquenta gramas de arroz branco",
        "50g de arroz",
        "duas bananas",
        "uma fatia de pão",
        "100 gramas de frango",
        "arroz branco", // sem quantidade
        "duas colheres de feijão"
    ];
    
    for (const texto of testeCases) {
        console.log(`\n🔍 Testando: "${texto}"`);
        
        try {
            const response = await axios.post(`${BASE_URL}/alimento/buscar-por-transcricao`, {
                texto_transcrito: texto,
                limite: 3
            });
            
            const encontrados = response.data.alimentos?.length || 0;
            console.log(`   📊 Resultados: ${encontrados}`);
            
            if (encontrados > 0) {
                const primeiro = response.data.alimentos[0];
                console.log(`   🥇 1º: ${primeiro.nome} (${primeiro.calorias}kcal)`);
                
                if (response.data.ia_agent_resultado) {
                    const ia = response.data.ia_agent_resultado;
                    console.log(`   🤖 IA: "${ia.alimento_extraido}" ${ia.quantidade_extraida}g`);
                }
            }
            
            // Pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.response?.data?.error || error.message}`);
        }
    }
}

// Executar testes
async function executar() {
    console.log('🚀 INICIANDO TESTES AVANÇADOS DO SISTEMA');
    console.log('=' * 60);
    
    await testeDetalhado();
    await testeMultiplosFormatos();
    
    console.log('\n🎉 TODOS OS TESTES AVANÇADOS CONCLUÍDOS!');
}

// Executar se for chamado diretamente
if (require.main === module) {
    executar().catch(console.error);
}

module.exports = {
    testeDetalhado,
    testeMultiplosFormatos,
    executar
};
