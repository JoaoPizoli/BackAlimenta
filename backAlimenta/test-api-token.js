const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
    try {
        // 1. Fazer login para obter token
        console.log('🔐 Fazendo login...');
        const loginResponse = await fetch('http://localhost:3333/nutri/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },            body: JSON.stringify({ 
                email: 'admin@admin.com', 
                senha: 'admin123' 
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('📡 Resposta do login:', loginData);
        
        if (!loginData.status || !loginData.token) {
            console.error('❌ Falha no login');
            return;
        }
        
        const token = loginData.token;
        console.log('✅ Token obtido:', token.substring(0, 20) + '...');
        
        // 2. Testar endpoint de alimentos
        console.log('\n🍽️ Testando endpoint de alimentos...');
        const alimentosResponse = await fetch('http://localhost:3333/alimentos-detalhados/data/4?data=2025-06-02', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const alimentosData = await alimentosResponse.json();
        console.log('📡 Resposta dos alimentos:', JSON.stringify(alimentosData, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

testAPI();
