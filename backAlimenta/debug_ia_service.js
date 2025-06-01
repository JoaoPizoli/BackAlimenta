console.log('🤖 TESTANDO IA SERVICE DIRETAMENTE');

const iaService = require('./src/services/iaService');

async function testIaService() {
    try {
        console.log('📝 Testando extração com texto: "cinquenta gramas de arroz branco"');
        const result = await iaService.extrairAlimentoEQuantidade("cinquenta gramas de arroz branco");
        console.log('✅ Resultado:', result);
    } catch (error) {
        console.error('❌ Erro detalhado:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

testIaService();
