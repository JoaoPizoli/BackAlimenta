const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class IAService {
    constructor() {
        // ATENÇÃO: Esta chave está exposta! Mova para variável de ambiente
        this.openai = new OpenAI({
            apiKey: "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"
        });
    }    // MÉTODO DE TRANSCRIÇÃO REMOVIDO
    // A transcrição agora é feita diretamente no Flutter usando OpenAI
    // Este serviço agora é responsável apenas pela extração de informações do texto transcrito

    async extrairAlimentoEQuantidade(texto) {
        const logPrefix = '[EXTRAÇÃO_IA]';
        const startTime = Date.now();
        
        try {
            console.log(`${logPrefix} 🤖 Iniciando extração de alimento e quantidade...`);
            console.log(`${logPrefix} ⏰ Timestamp: ${new Date().toISOString()}`);
            console.log(`${logPrefix} 📝 Texto recebido:`, {
                texto_original: texto,
                tamanho: texto?.length || 0,
                tipo: typeof texto
            });

            // Validar entrada de forma detalhada
            if (texto === null || texto === undefined) {
                throw new Error('ENTRADA_NULA: Texto é null ou undefined');
            }

            if (typeof texto !== 'string') {
                console.warn(`${logPrefix} ⚠️ Conversão de tipo: ${typeof texto} -> string`);
                texto = String(texto);
            }

            const textoLimpo = texto.trim();
            if (textoLimpo.length === 0) {
                throw new Error('ENTRADA_VAZIA: Texto vazio após trim()');
            }

            if (textoLimpo.length < 3) {
                throw new Error(`ENTRADA_MUITO_CURTA: Apenas ${textoLimpo.length} caracteres`);
            }

            console.log(`${logPrefix} ✅ Validação de entrada OK`, {
                texto_limpo: textoLimpo,
                tamanho_final: textoLimpo.length
            });

            // Preparar prompt otimizado
            const prompt = `
Você é um especialista em nutrição. Analise o texto abaixo e extraia as informações sobre alimentos consumidos.

REGRAS:
1. Identifique APENAS o nome do alimento principal (sem quantidades no nome)
2. Identifique a quantidade consumida em gramas
3. Se não mencionar quantidade, assuma 100g
4. Se mencionar "1 unidade", "1 fatia", etc., converta para gramas usando valores padrão
5. Responda SEMPRE no formato JSON exato abaixo
6. Use nomes simples e limpos para os alimentos
7. Considere sinônimos e variações regionais

CONVERSÕES PADRÃO:
- 1 banana média = 120g
- 1 fatia de pão = 25g
- 1 ovo = 50g
- 1 xícara de arroz = 150g
- 1 colher de sopa = 15g
- 1 copo (200ml) = 200g
- 1 prato de comida = 300g
- 1 porção = 150g

FORMATO DE RESPOSTA (JSON):
{
  "nome": "nome_do_alimento_limpo",
  "quantidade": numero_em_gramas,
  "confianca": numero_de_0_a_100,
  "observacoes": "detalhes_adicionais_se_necessario"
}

TEXTO PARA ANALISAR: "${textoLimpo}"

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`;

            console.log(`${logPrefix} 📤 Configuração para OpenAI:`, {
                modelo: "gpt-4o-mini",
                temperatura: 0.1,
                max_tokens: 300,
                tamanho_prompt: prompt.length
            });

            console.log(`${logPrefix} 🚀 Enviando requisição para OpenAI...`);
            const openaiStart = Date.now();

            let completion;
            try {
                completion = await this.openai.chat.completions.create({
                    model: "gpt-4o-mini", // Modelo mais econômico e eficiente
                    messages: [
                        {
                            role: "system",
                            content: "Você é um especialista em nutrição que extrai informações de alimentos de forma precisa. Sempre responda apenas com JSON válido, sem markdown ou texto adicional."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 300
                });

                const openaiTime = Date.now() - openaiStart;
                console.log(`${logPrefix} ⏱️ Tempo de resposta OpenAI: ${openaiTime}ms`);
                console.log(`${logPrefix} ✅ Resposta recebida da OpenAI`);
                
            } catch (openaiError) {
                console.error(`${logPrefix} ❌ ERRO na API OpenAI:`, {
                    message: openaiError.message,
                    code: openaiError.code,
                    type: openaiError.type,
                    status: openaiError.status
                });
                throw new Error(`OPENAI_ERROR: ${openaiError.message}`);
            }

            // Processar resposta da IA
            let resposta = completion.choices[0].message.content.trim();
            console.log(`${logPrefix} 📋 Resposta bruta da IA:`, {
                conteudo: resposta,
                tamanho: resposta.length,
                tokens_usados: completion.usage
            });

            // Limpar markdown se presente
            const respostaOriginal = resposta;
            resposta = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            if (respostaOriginal !== resposta) {
                console.log(`${logPrefix} 🧹 Markdown removido da resposta`);
            }

            console.log(`${logPrefix} 🔍 Resposta limpa:`, resposta);

            // Tentar parsear o JSON
            let resultado;
            try {
                resultado = JSON.parse(resposta);
                console.log(`${logPrefix} ✅ JSON parseado com sucesso:`, resultado);
            } catch (parseError) {
                console.error(`${logPrefix} ❌ ERRO ao parsear JSON:`, {
                    erro: parseError.message,
                    resposta_problematica: resposta,
                    caractere_problema: parseError.message.match(/position (\d+)/)?.[1]
                });
                throw new Error(`JSON_PARSE_ERROR: ${parseError.message}`);
            }
            
            // Validação estrutural detalhada
            const validationErrors = [];
            
            if (!resultado.nome) {
                validationErrors.push('Campo "nome" ausente ou vazio');
            } else if (typeof resultado.nome !== 'string') {
                validationErrors.push(`Campo "nome" deve ser string, recebido: ${typeof resultado.nome}`);
            }

            if (resultado.quantidade === null || resultado.quantidade === undefined) {
                validationErrors.push('Campo "quantidade" ausente');
            } else if (typeof resultado.quantidade !== 'number') {
                validationErrors.push(`Campo "quantidade" deve ser number, recebido: ${typeof resultado.quantidade}`);
            }

            if (validationErrors.length > 0) {
                console.error(`${logPrefix} ❌ ERROS de validação:`, validationErrors);
                throw new Error(`VALIDATION_ERROR: ${validationErrors.join('; ')}`);
            }

            // Validação de valores
            if (resultado.quantidade <= 0) {
                console.error(`${logPrefix} ❌ Quantidade inválida: ${resultado.quantidade} (deve ser > 0)`);
                throw new Error(`QUANTIDADE_INVALIDA: ${resultado.quantidade} <= 0`);
            }

            if (resultado.quantidade > 5000) {
                console.error(`${logPrefix} ❌ Quantidade muito alta: ${resultado.quantidade}g (limite: 5000g)`);
                throw new Error(`QUANTIDADE_EXCESSIVA: ${resultado.quantidade}g > 5000g`);
            }

            // Limpar e validar nome
            const nomeOriginal = resultado.nome;
            resultado.nome = resultado.nome.toLowerCase().trim();
            
            if (nomeOriginal !== resultado.nome) {
                console.log(`${logPrefix} 🧹 Nome normalizado: "${nomeOriginal}" -> "${resultado.nome}"`);
            }

            if (resultado.nome.length < 2) {
                console.error(`${logPrefix} ❌ Nome muito curto: "${resultado.nome}" (${resultado.nome.length} chars)`);
                throw new Error(`NOME_MUITO_CURTO: "${resultado.nome}"`);
            }

            // Log de sucesso com estatísticas
            const totalTime = Date.now() - startTime;
            console.log(`${logPrefix} 🎉 SUCESSO na extração!`, {
                resultado_final: resultado,
                tempo_total: totalTime + 'ms',
                confianca: resultado.confianca || 'N/A'
            });

            return { status: true, dados: resultado };

        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`${logPrefix} ❌ ERRO GERAL na extração:`, {
                erro: error.message,
                tipo: error.constructor.name,
                tempo_ate_erro: totalTime + 'ms',
                texto_processado: texto?.substring(0, 50) + '...'
            });
            
            console.log(`${logPrefix} 🔄 Tentando método de fallback (regex)...`);
            
            // Fallback: tentar extração simples com regex
            try {
                const fallback = this.extrairComRegex(texto);
                if (fallback.status) {
                    console.log(`${logPrefix} ✅ Fallback bem-sucedido!`);
                    return fallback;
                } else {
                    console.log(`${logPrefix} ❌ Fallback também falhou`);
                }
            } catch (fallbackError) {
                console.error(`${logPrefix} ❌ Erro no fallback:`, fallbackError.message);
            }
            
            return { 
                status: false, 
                error: error.message,
                debug_info: {
                    tempo_ate_erro: totalTime + 'ms',
                    metodo_fallback_tentado: true,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    extrairComRegex(texto) {
        const logPrefix = '[REGEX_FALLBACK]';
        
        try {
            console.log(`${logPrefix} 🔄 Tentando extração com regex...`);
            console.log(`${logPrefix} 📝 Texto para regex:`, texto);
            
            const textoLimpo = texto.toLowerCase().trim();
            
            // Regex melhorada para encontrar quantidades
            const regexQuantidade = /(\d+(?:[.,]\d+)?)\s*(g|gramas?|kg|quilos?|unidades?|fatias?|copos?|xícaras?|colheres?)/i;
            const matchQuantidade = textoLimpo.match(regexQuantidade);
            
            console.log(`${logPrefix} 🔍 Match quantidade:`, matchQuantidade);
            
            let quantidade = 100; // padrão
            if (matchQuantidade) {
                let valor = parseFloat(matchQuantidade[1].replace(',', '.'));
                const unidade = matchQuantidade[2].toLowerCase();
                
                console.log(`${logPrefix} 📊 Valor: ${valor}, Unidade: ${unidade}`);
                
                // Conversões baseadas na unidade
                if (unidade.includes('kg') || unidade.includes('quilo')) {
                    quantidade = valor * 1000;
                } else if (unidade.includes('unidade')) {
                    quantidade = valor * 120; // assumindo banana média
                } else if (unidade.includes('fatia')) {
                    quantidade = valor * 25; // fatia de pão
                } else if (unidade.includes('copo')) {
                    quantidade = valor * 200;
                } else if (unidade.includes('xícara')) {
                    quantidade = valor * 150;
                } else if (unidade.includes('colher')) {
                    quantidade = valor * 15;
                } else {
                    quantidade = valor; // já em gramas
                }
                
                console.log(`${logPrefix} ⚖️ Quantidade convertida: ${quantidade}g`);
            }

            // Tentar extrair nome do alimento
            let nome = textoLimpo
                .replace(/\d+(?:[.,]\d+)?\s*(g|gramas?|kg|quilos?|unidades?|fatias?|copos?|xícaras?|colheres?)/gi, '')
                .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            console.log(`${logPrefix} 🏷️ Nome extraído inicialmente: "${nome}"`);

            // Se nome muito curto, tentar palavras-chave comuns
            if (nome.length < 3) {
                const palavrasComuns = ['banana', 'pão', 'arroz', 'feijão', 'frango', 'ovo'];
                const palavraEncontrada = palavrasComuns.find(palavra => 
                    textoLimpo.includes(palavra)
                );
                if (palavraEncontrada) {
                    nome = palavraEncontrada;
                    console.log(`${logPrefix} 🎯 Palavra-chave encontrada: "${nome}"`);
                }
            }

            if (!nome || nome.length < 2) {
                console.error(`${logPrefix} ❌ Nome inválido: "${nome}"`);
                throw new Error('Não foi possível extrair o nome do alimento');
            }

            const resultado = {
                nome: nome,
                quantidade: Math.round(quantidade),
                confianca: 50, // confiança média para regex
                observacoes: 'Extração por regex - verificar precisão'
            };

            console.log(`${logPrefix} ✅ Extração por regex concluída:`, resultado);
            return { status: true, dados: resultado };

        } catch (error) {
            console.error(`${logPrefix} ❌ Erro na extração por regex:`, error.message);
            return { 
                status: false, 
                error: error.message,
                dados: {
                    nome: 'alimento_não_identificado',
                    quantidade: 100,
                    confianca: 10,
                    observacoes: 'Falha na extração - valores padrão aplicados'
                }
            };
        }
    }

    // Método auxiliar para limpar arquivos temporários
    cleanupTempFile(filePath) {
        const logPrefix = '[CLEANUP]';
        
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`${logPrefix} 🗑️ Arquivo temporário removido: ${filePath}`);
            } else {
                console.log(`${logPrefix} ⚠️ Arquivo já não existe: ${filePath}`);
            }
        } catch (error) {
            console.error(`${logPrefix} ❌ Erro ao remover arquivo temporário:`, {
                arquivo: filePath,
                erro: error.message
            });
        }
    }

    // Método auxiliar para detalhes de erro
    getErrorDetails(error) {
        const details = {
            tipo: error.constructor.name,
            codigo: error.code || 'N/A',
            timestamp: new Date().toISOString()
        };

        if (error.response) {
            details.status = error.response.status;
            details.statusText = error.response.statusText;
            details.data = error.response.data;
        }

        if (error.config) {
            details.request_config = {
                method: error.config.method,
                url: error.config.url,
                headers: error.config.headers
            };
        }

        return details;
    }

    // Método para validar se a API está funcionando
    async testarConexao() {
        const logPrefix = '[TESTE_CONEXAO]';
        
        try {
            console.log(`${logPrefix} 🔗 Testando conexão com OpenAI...`);
            
            const models = await this.openai.models.list();
            
            console.log(`${logPrefix} ✅ Conexão bem-sucedida!`, {
                total_modelos: models.data.length,
                primeiro_modelo: models.data[0]?.id || 'N/A'
            });
            
            return { 
                status: true, 
                message: 'Conexão com OpenAI OK',
                modelos: models.data.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`${logPrefix} ❌ Erro na conexão:`, {
                erro: error.message,
                detalhes: this.getErrorDetails(error)
            });
            
            return { 
                status: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new IAService();