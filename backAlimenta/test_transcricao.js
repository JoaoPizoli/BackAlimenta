const axios = require('axios');

async function testarTranscricao() {
    try {
        console.log('🧪 Testando rota de busca por transcrição...');
        
        const response = await axios.post('http://127.0.0.1:3333/alimento/buscar-por-transcricao', {
            texto_transcrito: 'banana',
            limite: 5
        });
        
        console.log('✅ Resposta da API:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testarTranscricao();
