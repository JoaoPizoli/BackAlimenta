/**
 * 🚀 Setup Direto para Paciente Flutter
 * Cria um paciente no banco e testa login + alimentos
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

async function setupPacienteFlutter() {
    const baseURL = 'http://127.0.0.1:3333';
    let connection;
    
    console.log('📱 === SETUP PACIENTE PARA FLUTTER ===\n');
    
    try {
        // Conectar ao banco
        console.log('🔌 Conectando ao banco...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });
        console.log('✅ Conectado ao banco!');
        
        // Criar paciente diretamente no banco
        const pacienteData = {
            nome: 'Maria Silva',
            email: 'maria@paciente.com',
            senha: '123456',
            peso: 65,
            altura: 165,
            telefone: '11999999999'
        };
        
        console.log('\n👤 Criando paciente de teste...');
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(pacienteData.senha, 10);
          // Inserir paciente (ou atualizar se já existir)
        await connection.execute(`
            INSERT INTO paciente (nome, email, senha, peso, altura, telefone) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            senha = VALUES(senha), 
            peso = VALUES(peso), 
            altura = VALUES(altura)
        `, [
            pacienteData.nome,
            pacienteData.email,
            senhaHash,
            pacienteData.peso,
            pacienteData.altura,
            pacienteData.telefone
        ]);
        
        console.log('✅ Paciente criado/atualizado no banco!');
        
        await connection.end();
        
    } catch (error) {
        console.log('❌ Erro no banco:', error.message);
        if (connection) await connection.end();
    }
    
    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Agora testar o login
    console.log('\n🔐 Testando login do paciente...');
    
    try {
        const response = await axios.post(`${baseURL}/paciente/login`, {
            email: 'maria@paciente.com',
            senha: '123456'
        });
        
        console.log('📊 Resposta do login:', JSON.stringify(response.data, null, 2));
        
        if (response.data.token) {
            console.log('\n✅ LOGIN FUNCIONANDO!');
            console.log('🎫 Token:', response.data.token.substring(0, 30) + '...');
            
            // Testar endpoint autenticado
            try {
                const profileResponse = await axios.get(`${baseURL}/paciente/perfil`, {
                    headers: { 'Authorization': `Bearer ${response.data.token}` }
                });
                console.log('✅ Autenticação funcionando!');
            } catch (err) {
                console.log('⚠️  Endpoint de perfil não disponível (normal)');
            }
            
        } else {
            console.log('❌ Login falhou - sem token na resposta');
        }
        
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data || error.message);
    }
    
    // Testar alimentos
    console.log('\n🥗 Testando busca de alimentos...');
    
    try {
        const response = await axios.get(`${baseURL}/alimentos`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log('✅ ALIMENTOS DISPONÍVEIS!');
            console.log(`📊 Total: ${response.data.length} alimentos`);
            
            console.log('\n🍎 Primeiros alimentos:');
            response.data.slice(0, 5).forEach((alimento, i) => {
                console.log(`   ${i+1}. ${alimento.nome} - ${alimento.energia_kcal || 0}kcal`);
            });
            
        } else {
            console.log('❌ Nenhum alimento encontrado');
        }
        
    } catch (error) {
        console.log('❌ Erro ao buscar alimentos:', error.response?.data || error.message);
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📱 CREDENCIAIS PARA O APP FLUTTER:');
    console.log('='.repeat(60));
    console.log('📧 Email: maria@paciente.com');
    console.log('🔒 Senha: 123456');
    console.log('');
    console.log('🔗 ENDPOINTS:');
    console.log(`   Login: POST ${baseURL}/paciente/login`);
    console.log(`   Alimentos: GET ${baseURL}/alimentos`);
    console.log('');
    console.log('🎯 Use essas credenciais no seu app Flutter!');
    console.log('='.repeat(60));
}

// Executa se chamado diretamente
if (require.main === module) {
    setupPacienteFlutter().catch(error => {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = setupPacienteFlutter;
