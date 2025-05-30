/**
 * 📱 Guia Completo para Implementação no Flutter
 * Mostra exatamente como fazer a requisição no Flutter
 */

const axios = require('axios');

async function guiaFlutter() {
    console.log('📱 === GUIA DE IMPLEMENTAÇÃO FLUTTER ===\n');
    
    const baseURL = 'http://127.0.0.1:3333';
    
    // Mostrar como deve ser no Flutter
    console.log('📋 CÓDIGO FLUTTER CORRETO:');
    console.log('='.repeat(50));
    
    console.log(`
// 1. No seu service/api classe:
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:3333';
  
  Future<Map<String, dynamic>> loginPaciente(String email, String senha) async {
    try {
      final response = await http.post(
        Uri.parse('\$baseUrl/paciente/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'senha': senha,
        }),
      );
      
      print('Status Code: \${response.statusCode}');
      print('Response Body: \${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['status'] == true && data['token'] != null) {
          return {
            'success': true,
            'token': data['token'],
            'paciente': data['paciente'],
          };
        } else {
          return {
            'success': false,
            'message': data['message'] ?? 'Login falhou',
          };
        }
      } else {
        return {
          'success': false,
          'message': 'Erro do servidor: \${response.statusCode}',
        };
      }
    } catch (e) {
      print('Erro na requisição: \$e');
      return {
        'success': false,
        'message': 'Erro de conexão: \$e',
      };
    }
  }
}

// 2. No seu widget de login:
Future<void> _fazerLogin() async {
  final email = 'maria@paciente.com';
  final senha = '123456';
  
  try {
    final result = await ApiService().loginPaciente(email, senha);
    
    if (result['success']) {
      // Login funcionou!
      final token = result['token'];
      final paciente = result['paciente'];
      
      print('Login sucesso! Token: \$token');
      
      // Salvar token e navegar para próxima tela
      // SharedPreferences prefs = await SharedPreferences.getInstance();
      // await prefs.setString('token', token);
      
    } else {
      // Mostrar erro
      print('Erro no login: \${result['message']}');
      // Mostrar snackbar ou dialog com erro
    }
  } catch (e) {
    print('Erro inesperado: \$e');
  }
}
`);
    
    console.log('='.repeat(50));
    
    // Testar possíveis problemas comuns
    console.log('\n🔍 POSSÍVEIS PROBLEMAS NO FLUTTER:');
    console.log('');
    
    console.log('1️⃣ URL incorreta:');
    console.log('   ❌ http://localhost:3333 (pode não funcionar no emulador)');
    console.log('   ❌ http://127.0.0.1:3333 (pode não funcionar no device físico)');
    console.log('   ✅ Para emulador Android: http://10.0.2.2:3333');
    console.log('   ✅ Para emulador iOS: http://127.0.0.1:3333');
    console.log('   ✅ Para device físico: http://SEU_IP_LOCAL:3333');
    
    console.log('\n2️⃣ Headers ausentes:');
    console.log('   ✅ SEMPRE incluir: Content-Type: application/json');
    
    console.log('\n3️⃣ Body malformado:');
    console.log('   ❌ FormData ou queryParams');
    console.log('   ✅ JSON: jsonEncode({"email": "...", "senha": "..."})');
    
    console.log('\n4️⃣ Tratamento de response:');
    console.log('   ✅ Verificar response.statusCode == 200');
    console.log('   ✅ Verificar data["status"] == true');
    console.log('   ✅ Verificar se data["token"] existe');
    
    // Verificar IP local
    console.log('\n🌐 VERIFICANDO SEU IP LOCAL:');
    try {
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`   📍 IP local: http://${net.address}:3333`);
                    
                    // Testar se o servidor responde neste IP
                    try {
                        await axios.get(`http://${net.address}:3333/health`, { timeout: 2000 });
                        console.log(`   ✅ Servidor acessível em: http://${net.address}:3333`);
                    } catch (err) {
                        console.log(`   ❌ Servidor NÃO acessível em: http://${net.address}:3333`);
                    }
                }
            }
        }
    } catch (error) {
        console.log('   ⚠️  Não foi possível detectar IP local');
    }
    
    console.log('\n📱 TESTE RÁPIDO NO FLUTTER:');
    console.log('='.repeat(50));
    console.log('1. Copie o código acima para seu projeto Flutter');
    console.log('2. Adicione dependency: http: ^0.13.5');
    console.log('3. Use a URL correta para seu ambiente:');
    console.log('   - Emulador Android: http://10.0.2.2:3333');
    console.log('   - Emulador iOS: http://127.0.0.1:3333');
    console.log('   - Device físico: http://SEU_IP_LOCAL:3333');
    console.log('4. Teste com as credenciais:');
    console.log('   - Email: maria@paciente.com');
    console.log('   - Senha: 123456');
    console.log('='.repeat(50));
}

// Executa o guia
if (require.main === module) {
    guiaFlutter().catch(error => {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    });
}

module.exports = guiaFlutter;
