/**
 * Suite Principal de Testes - AlimentaAI Backend
 * Executa todos os testes de forma organizada
 */

const { execSync } = require('child_process');
const path = require('path');

class TestRunner {
    constructor() {
        this.testResults = {
            unit: [],
            integration: [],
            setup: []
        };
    }

    async runTest(testFile, category) {
        try {
            console.log(`\n🧪 Executando: ${testFile}`);
            const filePath = path.join(__dirname, category, testFile);
            
            // Executa o teste
            execSync(`node "${filePath}"`, { stdio: 'inherit' });
            
            this.testResults[category].push({ file: testFile, status: 'PASS' });
            console.log(`✅ ${testFile} - PASSOU`);
            
        } catch (error) {
            this.testResults[category].push({ file: testFile, status: 'FAIL', error: error.message });
            console.log(`❌ ${testFile} - FALHOU`);
        }
    }

    async runUnitTests() {
        console.log('\n📋 === TESTES UNITÁRIOS ===');
        await this.runTest('test_connection.js', 'unit');
        await this.runTest('verificar_estrutura.js', 'unit');
        await this.runTest('verificar_paciente.js', 'unit');
    }

    async runIntegrationTests() {
        console.log('\n🔗 === TESTES DE INTEGRAÇÃO ===');
        await this.runTest('test_login.js', 'integration');
        await this.runTest('testar_login_novo.js', 'integration');
        await this.runTest('testar_paciente_novo.js', 'integration');
        await this.runTest('testar_meta.js', 'integration');
        await this.runTest('testar_nova_estrutura.js', 'integration');
        await this.runTest('simular_flutter.js', 'integration');
    }

    async runSetupTests() {
        console.log('\n⚙️ === TESTES DE CONFIGURAÇÃO ===');
        await this.runTest('setup_teste_rapido.js', 'setup');
        await this.runTest('setup_database.js', 'setup');
        await this.runTest('setup_flutter_test.js', 'setup');
    }

    printSummary() {
        console.log('\n📊 === RESUMO DOS TESTES ===');
        
        const categories = ['unit', 'integration', 'setup'];
        let totalTests = 0;
        let totalPassed = 0;

        categories.forEach(category => {
            const tests = this.testResults[category];
            const passed = tests.filter(t => t.status === 'PASS').length;
            const failed = tests.filter(t => t.status === 'FAIL').length;
            
            totalTests += tests.length;
            totalPassed += passed;
            
            console.log(`\n${category.toUpperCase()}:`);
            console.log(`  ✅ Passou: ${passed}`);
            console.log(`  ❌ Falhou: ${failed}`);
            console.log(`  📝 Total: ${tests.length}`);
        });

        console.log(`\n🎯 RESULTADO GERAL:`);
        console.log(`  ✅ ${totalPassed}/${totalTests} testes passaram`);
        console.log(`  📊 Taxa de sucesso: ${((totalPassed/totalTests) * 100).toFixed(1)}%`);
    }

    async runAll() {
        console.log('🚀 === INICIANDO SUITE DE TESTES ===');
        
        await this.runUnitTests();
        await this.runIntegrationTests();
        await this.runSetupTests();
        
        this.printSummary();
    }

    async runQuick() {
        console.log('⚡ === TESTE RÁPIDO ===');
        
        // Apenas os testes essenciais
        await this.runTest('test_connection.js', 'unit');
        await this.runTest('test_login.js', 'integration');
        
        this.printSummary();
    }
}

// Execução baseada em argumentos
if (require.main === module) {
    const runner = new TestRunner();
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        runner.runQuick();
    } else if (args.includes('--unit') || args.includes('-u')) {
        runner.runUnitTests().then(() => runner.printSummary());
    } else if (args.includes('--integration') || args.includes('-i')) {
        runner.runIntegrationTests().then(() => runner.printSummary());
    } else if (args.includes('--setup') || args.includes('-s')) {
        runner.runSetupTests().then(() => runner.printSummary());
    } else {
        runner.runAll();
    }
}

module.exports = TestRunner;
