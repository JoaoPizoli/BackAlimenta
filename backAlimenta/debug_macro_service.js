console.log('🔍 DEBUGANDO MACRO CALCULATOR SERVICE');

console.log('\n1. Testando import direto...');
try {
    const MacroCalculatorService = require('./src/services/macroCalculatorService');
    console.log('✅ MacroCalculatorService importado:', typeof MacroCalculatorService);
    console.log('✅ É uma função/classe?', typeof MacroCalculatorService === 'function');
    
    console.log('\n2. Testando instanciação...');
    const instance = new MacroCalculatorService();
    console.log('✅ Instância criada:', typeof instance);
    console.log('✅ Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    
    console.log('\n3. Testando método calcularMacrosComTexto...');
    console.log('✅ Método existe?', typeof instance.calcularMacrosComTexto === 'function');
    
} catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
}

console.log('\n4. Testando import como usado em routes.js...');
try {
    const MacroCalculatorService = require('./src/services/macroCalculatorService');
    const macroCalculatorService = new MacroCalculatorService();
    console.log('✅ Funcionou como em routes.js');
} catch (error) {
    console.error('❌ Erro na forma do routes.js:', error.message);
}
