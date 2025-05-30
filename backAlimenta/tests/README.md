# 🧪 Suite de Testes - AlimentaAI Backend

## 📁 Estrutura Organizada

```
tests/
├── index.js              # Runner principal dos testes
├── unit/                 # Testes unitários
│   ├── test_connection.js     # Teste de conexão com DB
│   ├── verificar_estrutura.js # Verificação da estrutura
│   └── verificar_paciente.js  # Verificação de paciente
├── integration/          # Testes de integração
│   ├── test_login.js         # Teste de login
│   ├── testar_login_novo.js  # Teste de login novo
│   ├── testar_paciente_novo.js # Teste de paciente
│   ├── testar_meta.js        # Teste de metas
│   ├── testar_nova_estrutura.js # Teste estrutura nova
│   └── simular_flutter.js    # Simulação Flutter
└── setup/                # Scripts de configuração
    ├── setup_teste_rapido.js   # Setup rápido
    ├── setup_database.js       # Setup do banco
    ├── setup_flutter_test.js   # Setup Flutter
    ├── generate_test_token.js  # Gerador de tokens
    ├── criar_dados_teste.js    # Criação de dados
    └── limpar_e_recriar.js     # Limpeza e recriação
```

## 🚀 Como Usar

### Executar Todos os Testes
```bash
node tests/index.js
```

### Teste Rápido (apenas essenciais)
```bash
node tests/index.js --quick
# ou
node tests/index.js -q
```

### Executar por Categoria

**Testes Unitários:**
```bash
node tests/index.js --unit
# ou
node tests/index.js -u
```

**Testes de Integração:**
```bash
node tests/index.js --integration
# ou
node tests/index.js -i
```

**Scripts de Setup:**
```bash
node tests/index.js --setup
# ou
node tests/index.js -s
```

### Executar Teste Individual
```bash
# Teste de conexão
node tests/unit/test_connection.js

# Teste de login
node tests/integration/test_login.js

# Setup rápido
node tests/setup/setup_teste_rapido.js
```

## 📊 Tipos de Teste

### 🔧 Unitários
- **test_connection.js**: Verifica conexão com banco de dados
- **verificar_estrutura.js**: Valida estrutura das tabelas
- **verificar_paciente.js**: Testa funcionalidades de paciente

### 🔗 Integração
- **test_login.js**: Testa sistema de login completo
- **testar_paciente_novo.js**: Testa fluxo completo de paciente
- **testar_meta.js**: Testa sistema de metas
- **simular_flutter.js**: Simula requisições do app Flutter

### ⚙️ Setup
- **setup_teste_rapido.js**: Configuração rápida para testes
- **setup_database.js**: Inicialização do banco de dados
- **criar_dados_teste.js**: Criação de dados de teste

## 📋 Exemplo de Saída

```
🚀 === INICIANDO SUITE DE TESTES ===

📋 === TESTES UNITÁRIOS ===
🧪 Executando: test_connection.js
✅ test_connection.js - PASSOU

🔗 === TESTES DE INTEGRAÇÃO ===
🧪 Executando: test_login.js
✅ test_login.js - PASSOU

📊 === RESUMO DOS TESTES ===
UNIT:
  ✅ Passou: 3
  ❌ Falhou: 0
  📝 Total: 3

🎯 RESULTADO GERAL:
  ✅ 8/8 testes passaram
  📊 Taxa de sucesso: 100.0%
```

## 💡 Dicas

1. **Antes de rodar os testes**: Certifique-se que o servidor está rodando
2. **Para desenvolvimento**: Use `--quick` para testes rápidos
3. **Para CI/CD**: Use o comando completo para todos os testes
4. **Debug**: Execute testes individuais para investigar problemas
