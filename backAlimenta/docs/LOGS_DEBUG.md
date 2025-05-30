# 📊 Sistema de Logs Detalhados - iaService.js

## 🎯 Objetivo
Este documento explica o sistema de logs implementado no `iaService.js` para facilitar o debug de problemas com áudio e transcrição.

## 🔍 Logs de Transcrição de Áudio

### Prefixo: `[AUDIO_TRANSCRIPTION]`

Os logs da transcrição seguem este fluxo:

1. **Início da Transcrição**
   ```
   [AUDIO_TRANSCRIPTION] 🎤 Iniciando transcrição de áudio...
   [AUDIO_TRANSCRIPTION] ⏰ Timestamp: 2025-05-29T...
   ```

2. **Validação do Arquivo**
   ```
   [AUDIO_TRANSCRIPTION] 📁 Arquivo recebido: {originalname, mimetype, size, path...}
   [AUDIO_TRANSCRIPTION] 🔍 Verificando existência do arquivo: caminho/arquivo
   ```

3. **Análise Detalhada**
   ```
   [AUDIO_TRANSCRIPTION] 📊 Estatísticas do arquivo: {tamanho_bytes, tamanho_MB...}
   [AUDIO_TRANSCRIPTION] 🎵 Verificando tipo MIME: audio/mpeg
   [AUDIO_TRANSCRIPTION] 🔍 Primeiros bytes do arquivo (hex): 494433...
   ```

4. **Chamada para OpenAI**
   ```
   [AUDIO_TRANSCRIPTION] 🤖 Configuração da transcrição: {model, response_format...}
   [AUDIO_TRANSCRIPTION] 🚀 Enviando para OpenAI Whisper...
   [AUDIO_TRANSCRIPTION] ⏱️ Tempo de transcrição: 1500ms
   ```

5. **Resultado Final**
   ```
   [AUDIO_TRANSCRIPTION] 📝 Resposta bruta da transcrição: {tipo, tamanho, conteudo...}
   [AUDIO_TRANSCRIPTION] 📊 Estatísticas finais: {tempo_total_ms, chars_por_segundo...}
   [AUDIO_TRANSCRIPTION] 🎉 SUCESSO na transcrição!
   ```

### ❌ Logs de Erro na Transcrição

```
[AUDIO_TRANSCRIPTION] ❌ ERRO GERAL na transcrição: {erro, tipo, stack, tempo_ate_erro...}
```

**Códigos de Erro Específicos:**
- `ERRO_CRITICO`: audioFile é null ou path não definido
- `ARQUIVO_NAO_ENCONTRADO`: arquivo não existe no sistema
- `ARQUIVO_MUITO_GRANDE`: > 25MB
- `ARQUIVO_VAZIO`: 0 bytes
- `ERRO_LEITURA_ARQUIVO`: não consegue ler o arquivo
- `ERRO_STREAM`: erro ao criar stream
- `OPENAI_API_ERROR`: erro na API da OpenAI

## 🤖 Logs de Extração de Alimentos

### Prefixo: `[EXTRAÇÃO_IA]`

1. **Início da Extração**
   ```
   [EXTRAÇÃO_IA] 🤖 Iniciando extração de alimento e quantidade...
   [EXTRAÇÃO_IA] 📝 Texto recebido: {texto_original, tamanho, tipo}
   ```

2. **Validação da Entrada**
   ```
   [EXTRAÇÃO_IA] ✅ Validação de entrada OK: {texto_limpo, tamanho_final}
   ```

3. **Chamada para OpenAI**
   ```
   [EXTRAÇÃO_IA] 📤 Configuração para OpenAI: {modelo, temperatura, max_tokens...}
   [EXTRAÇÃO_IA] 🚀 Enviando requisição para OpenAI...
   [EXTRAÇÃO_IA] ⏱️ Tempo de resposta OpenAI: 800ms
   ```

4. **Processamento da Resposta**
   ```
   [EXTRAÇÃO_IA] 📋 Resposta bruta da IA: {conteudo, tamanho, tokens_usados}
   [EXTRAÇÃO_IA] 🔍 Resposta limpa: {"nome":"banana","quantidade":120...}
   [EXTRAÇÃO_IA] ✅ JSON parseado com sucesso: {nome, quantidade, confianca}
   ```

5. **Validação e Normalização**
   ```
   [EXTRAÇÃO_IA] 🧹 Nome normalizado: "Banana" -> "banana"
   [EXTRAÇÃO_IA] 🎉 SUCESSO na extração!
   ```

### ❌ Logs de Erro na Extração

```
[EXTRAÇÃO_IA] ❌ ERRO GERAL na extração: {erro, tipo, tempo_ate_erro...}
[EXTRAÇÃO_IA] 🔄 Tentando método de fallback (regex)...
```

**Códigos de Erro Específicos:**
- `ENTRADA_NULA`: texto é null ou undefined
- `ENTRADA_VAZIA`: texto vazio após trim()
- `ENTRADA_MUITO_CURTA`: menos de 3 caracteres
- `OPENAI_ERROR`: erro na API da OpenAI
- `JSON_PARSE_ERROR`: erro ao parsear JSON
- `VALIDATION_ERROR`: campos obrigatórios ausentes
- `QUANTIDADE_INVALIDA`: quantidade <= 0
- `QUANTIDADE_EXCESSIVA`: quantidade > 5000g
- `NOME_MUITO_CURTO`: nome com menos de 2 caracteres

## 🔄 Logs de Fallback (Regex)

### Prefixo: `[REGEX_FALLBACK]`

Quando a IA falha, o sistema tenta extrair informações usando regex:

```
[REGEX_FALLBACK] 🔄 Tentando extração com regex...
[REGEX_FALLBACK] 🔍 Match quantidade: ["200g", "200", "g"]
[REGEX_FALLBACK] 📊 Valor: 200, Unidade: g
[REGEX_FALLBACK] ⚖️ Quantidade convertida: 200g
[REGEX_FALLBACK] 🏷️ Nome extraído inicialmente: "banana"
[REGEX_FALLBACK] ✅ Extração por regex concluída!
```

## 🧹 Logs de Limpeza

### Prefixo: `[CLEANUP]`

```
[CLEANUP] 🗑️ Arquivo temporário removido: /tmp/upload_123.mp3
[CLEANUP] ❌ Erro ao remover arquivo temporário: {arquivo, erro}
```

## 🔗 Logs de Teste de Conexão

### Prefixo: `[TESTE_CONEXAO]`

```
[TESTE_CONEXAO] 🔗 Testando conexão com OpenAI...
[TESTE_CONEXAO] ✅ Conexão bem-sucedida! {total_modelos, primeiro_modelo}
```

## 🎨 Emojis e Códigos de Cores

- 🎤 Início de transcrição
- 📁 Arquivo/dados
- 🔍 Verificação/análise
- 📊 Estatísticas
- 🎵 Áudio/formato
- 🤖 IA/OpenAI
- 🚀 Envio/processamento
- ⏱️ Tempo/performance
- 📝 Texto/resposta
- 🧹 Limpeza
- ✅ Sucesso
- ❌ Erro
- ⚠️ Aviso
- 🔄 Fallback/retry
- 🎉 Sucesso final

## 💡 Como Usar para Debug

1. **Para problemas de áudio**: Procure por logs com `[AUDIO_TRANSCRIPTION]`
2. **Para problemas de extração**: Procure por logs com `[EXTRAÇÃO_IA]`
3. **Para erros específicos**: Filtre por ❌ e códigos de erro em maiúsculo
4. **Para performance**: Observe os tempos em logs com ⏱️
5. **Para dados de entrada**: Verifique logs com 📁 e 📝

## 🔧 Configuração Recomendada

Para melhor visualização dos logs, configure seu console para mostrar:
- Timestamps
- Cores (se suportado)
- Quebras de linha preservadas
- Objetos JSON expandidos

## 📈 Métricas Coletadas

- Tempo total de processamento
- Tempo de resposta da OpenAI
- Tamanho dos arquivos
- Número de caracteres processados
- Taxa de caracteres por segundo
- Uso de tokens da OpenAI
- Taxa de sucesso/falha
