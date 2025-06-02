// Teste das funções do dashboard

// Simular o ambiente do navegador
const localStorage = {
    data: {},
    setItem: function(key, value) { this.data[key] = value; },
    getItem: function(key) { return this.data[key] || null; },
    removeItem: function(key) { delete this.data[key]; }
};

global.localStorage = localStorage;
global.fetch = async function(url, options = {}) {
    const axios = require('axios');
    
    try {
        const config = {
            method: options.method || 'GET',
            url: url,
            headers: options.headers || {},
            data: options.body ? JSON.parse(options.body) : undefined
        };
        
        const response = await axios(config);
        
        return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            json: async () => response.data
        };
    } catch (error) {
        if (error.response) {
            return {
                ok: false,
                status: error.response.status,
                json: async () => error.response.data
            };
        }
        throw error;
    }
};

// Importar o data-service (simulando)
const fs = require('fs');
const path = require('path');

// Ler o arquivo data-service.js
const dataServicePath = path.join(__dirname, '../../dashGemini/js/data-service.js');
const dataServiceCode = fs.readFileSync(dataServicePath, 'utf8');

// Executar o código em um contexto simulado
const window = { AlimentaAIDataService: null };
eval(dataServiceCode.replace('(function(window) {', '(function(window) {').replace('})(window);', '})(window);'));

async function testarFuncoesMacros() {
    console.log('🧪 === TESTE DAS FUNÇÕES DE MACROS ===\n');
    
    const DataService = window.AlimentaAIDataService;
    
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResult = await DataService.authenticateAdmin('carlos@nutri.com', '123456');
    
    if (!loginResult.success) {
        console.log('❌ Falha no login:', loginResult.message);
        return;
    }
    
    console.log('✅ Login OK!\n');
    
    // 2. Buscar pacientes
    console.log('2️⃣ Buscando pacientes...');
    const patientsResult = await DataService.getPatients();
    
    if (!patientsResult.success) {
        console.log('❌ Falha ao buscar pacientes:', patientsResult.message);
        return;
    }
    
    console.log(`✅ ${patientsResult.patients.length} paciente(s) encontrado(s):`);
    patientsResult.patients.forEach(p => {
        console.log(`   - ${p.name} (${p.email})`);
    });
    
    // 3. Testar busca de macros
    if (patientsResult.patients.length > 0) {
        const primeiroPatiente = patientsResult.patients[0];
        console.log(`\n3️⃣ Buscando macros de ${primeiroPatiente.name}...`);
        
        const macros = await DataService.getPatientMacros(primeiroPatiente.email);
        
        if (macros) {
            console.log('✅ Macros encontradas:', macros);
        } else {
            console.log('❌ Macros não encontradas');
        }
        
        // 4. Testar definir macros
        console.log(`\n4️⃣ Testando definir macros para ${primeiroPatiente.name}...`);
        
        const novasMacros = {
            calories: 2200,
            proteins: 160,
            carbs: 220,
            fats: 75
        };
        
        const setResult = await DataService.setPatientMacros(primeiroPatiente.email, novasMacros);
        
        if (setResult.success) {
            console.log('✅ Macros definidas:', setResult.message);
        } else {
            console.log('❌ Erro ao definir macros:', setResult.message);
        }
    }
    
    console.log('\n🎉 Teste concluído!');
}

testarFuncoesMacros().catch(console.error);
