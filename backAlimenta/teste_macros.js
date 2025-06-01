const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3333';

// Teste específico para verificar cálculo de macros
async function testeCalculoMacros() {
    console.log('\n🧮 ===== TESTE CÁLCULO DE MACROS =====');
    
    const testeCases = [
        {
            input: "cinquenta gramas de arroz branco",
            expected_quantity: 50,
            description: "50g de arroz (metade dos valores da tabela)"
        },
        {
            input: "duzentos gramas de frango grelhado", 
            expected_quantity: 200,
            description: "200g de frango (dobro dos valores da tabela)"
        },
        {
            input: "uma fatia de pão francês",
            expected_quantity: 25, // 1 fatia = ~25g
            description: "1 fatia de pão (~25g)"
        },
        {
            input: "duas colheres de feijão preto",
            expected_quantity: 30, // 2 colheres = 2 * 15g
            description: "2 colheres de feijão (~30g)"
        }
    ];
    
    for (const testCase of testeCases) {
        console.log(`\n🔍 ${testCase.description}`);
        console.log(`📝 Input: "${testCase.input}"`);
        
        try {
            const response = await axios.post(`${BASE_URL}/alimento/buscar-por-transcricao`, {
                texto_transcrito: testCase.input,
                limite: 1
            });
            
            if (response.data.alimentos && response.data.alimentos.length > 0) {
                const alimento = response.data.alimentos[0];
                
                console.log(`✅ Encontrado: ${alimento.nome}`);
                console.log(`📊 Macros atuais:`);
                console.log(`   🔥 Calorias: ${alimento.calorias}kcal`);
                console.log(`   🥩 Proteína: ${alimento.proteinas}g`);
                console.log(`   🍞 Carboidratos: ${alimento.carboidratos}g`);
                console.log(`   🥑 Gordura: ${alimento.gordura}g`);
                
                // Verificar se há informações de cálculo
                if (alimento.informacoes_calculo) {
                    const calc = alimento.informacoes_calculo;
                    console.log(`🧮 Cálculo aplicado:`);
                    console.log(`   📏 Quantidade detectada: ${calc.quantidade_detectada.quantidade_final}g`);
                    console.log(`   📊 Macros originais (100g): ${calc.macros_originais.calorias}kcal`);
                    
                    // Verificar se a quantidade está correta
                    const qtdDetectada = calc.quantidade_detectada.quantidade_final;
                    if (Math.abs(qtdDetectada - testCase.expected_quantity) <= 5) {
                        console.log(`   ✅ Quantidade correta! (esperado: ~${testCase.expected_quantity}g)`);
                    } else {
                        console.log(`   ⚠️ Quantidade diferente do esperado (esperado: ~${testCase.expected_quantity}g)`);
                    }
                } else {
                    console.log(`   ⚠️ Macros não foram recalculados (usando valores de 100g)`);
                }
            } else {
                console.log(`❌ Nenhum alimento encontrado`);
            }
            
            // Pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.log(`❌ Erro: ${error.response?.data?.error || error.message}`);
        }
    }
}

// Teste manual para validar cálculos
async function testeValidacaoManual() {
    console.log('\n🧮 ===== VALIDAÇÃO MANUAL DE CÁLCULOS =====');
    
    try {
        // Teste com arroz: 50g deveria ser metade de 130kcal = 65kcal
        const response = await axios.post(`${BASE_URL}/alimento/buscar-por-transcricao`, {
            texto_transcrito: "cinquenta gramas de arroz branco",
            limite: 1
        });
        
        if (response.data.alimentos && response.data.alimentos.length > 0) {
            const alimento = response.data.alimentos[0];
            
            console.log(`🥗 Alimento: ${alimento.nome}`);
            console.log(`📊 Valores retornados: ${alimento.calorias}kcal`);
            
            // Valores esperados para 50g (metade de 100g)
            const expectedCalorias = 130 * 0.5; // 65kcal
            const expectedProteinas = 2.7 * 0.5; // 1.35g
            const expectedCarbs = 28 * 0.5; // 14g
            const expectedGordura = 0.3 * 0.5; // 0.15g
            
            console.log(`🎯 Valores esperados para 50g:`);
            console.log(`   🔥 Calorias: ${expectedCalorias}kcal`);
            console.log(`   🥩 Proteína: ${expectedProteinas}g`);
            console.log(`   🍞 Carboidratos: ${expectedCarbs}g`);
            console.log(`   🥑 Gordura: ${expectedGordura}g`);
            
            // Verificar se os valores estão próximos
            const caloriasOk = Math.abs(alimento.calorias - expectedCalorias) <= 2;
            const proteinasOk = Math.abs(alimento.proteinas - expectedProteinas) <= 0.2;
            
            if (caloriasOk && proteinasOk) {
                console.log(`✅ CÁLCULOS CORRETOS!`);
            } else {
                console.log(`⚠️ Cálculos podem estar incorretos`);
                console.log(`   📊 Diferença calorias: ${Math.abs(alimento.calorias - expectedCalorias)}`);
                console.log(`   📊 Diferença proteínas: ${Math.abs(alimento.proteinas - expectedProteinas)}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Erro na validação: ${error.message}`);
    }
}

// Executar testes
async function executar() {
    console.log('🧮 INICIANDO TESTES DE CÁLCULO DE MACROS');
    console.log('=' * 50);
    
    await testeCalculoMacros();
    await testeValidacaoManual();
    
    console.log('\n🎉 TESTES DE MACROS CONCLUÍDOS!');
}

// Executar se for chamado diretamente
if (require.main === module) {
    executar().catch(console.error);
}

module.exports = {
    testeCalculoMacros,
    testeValidacaoManual,
    executar
};
