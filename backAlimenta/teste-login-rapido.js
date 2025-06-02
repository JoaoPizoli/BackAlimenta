const axios = require('axios');

async function testarLogin() {
    const baseURL = 'http://127.0.0.1:3333';
    
    console.log('🔐 Testando login do Carlos...');
    
    try {
        const response = await axios.post(`${baseURL}/nutri/login`, {
            email: 'carlos@nutri.com',
            senha: '123456'
        });
        
        console.log('📡 Resposta do login:', response.data);
        
        if (response.data.status && response.data.token) {
            const nutriId = response.data.nutri.nutri_id;
            const token = response.data.token;
            
            console.log('✅ Login OK! Testando busca de pacientes...');
            
            const pacientesResponse = await axios.get(`${baseURL}/nutri/pacientes/${nutriId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Resposta dos pacientes:', pacientesResponse.data);
            
        } else {
            console.log('❌ Falha no login');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

testarLogin();
