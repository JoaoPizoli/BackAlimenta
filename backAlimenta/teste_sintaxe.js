// Teste rápido de sintaxe do iaService.js
console.log('🔍 Testando sintaxe do iaService...');

try {
    const iaService = require('./src/services/iaService.js');
    console.log('✅ Sintaxe OK! IAService carregado com sucesso');
    console.log('📝 Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(iaService)));
    console.log('🎯 Tipo do método principal:', typeof iaService.extrairAlimentoEQuantidade);
} catch (error) {
    console.log('❌ ERRO de sintaxe:');
    console.log(error.message);
    console.log(error.stack);
}
