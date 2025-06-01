const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class IAService {
    constructor() {
        // ATENÇÃO: Esta chave está exposta! Mova para variável de ambiente
        this.openai = new OpenAI({
            apiKey: "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"        });
    }

    // MÉTODO DE TRANSCRIÇÃO REMOVIDO
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
            });            // Preparar prompt otimizado
            const prompt = `
Você é um especialista em nutrição. Analise o texto abaixo e extraia APENAS o nome do alimento consumido.

REGRAS IMPORTANTES:
1. Extraia SOMENTE o nome do alimento (ex: "arroz", "banana", "pão")
2. NÃO inclua quantidades, verbos ou outras palavras no nome
3. Use nomes genéricos encontrados em tabelas nutricionais (TACO)
4. Identifique a quantidade em gramas separadamente
5. Responda SEMPRE no formato JSON exato

CONVERSÕES DE QUANTIDADE:
- "cinquenta gramas" = 50g
- "duas fatias" = 50g (25g cada)
- "uma xícara" = 150g
- "um copo" = 200g
- "uma banana" = 120g
- "um ovo" = 50g

EXEMPLOS:
"Eu comi cinquenta gramas de arroz" → {"nome": "arroz", "quantidade": 50}
"Comi duas bananas hoje" → {"nome": "banana", "quantidade": 240}
"Uma fatia de pão francês" → {"nome": "pão francês", "quantidade": 25}

FORMATO DE RESPOSTA:
{
  "nome": "nome_simples_do_alimento",
  "quantidade": numero_em_gramas,
  "confianca": numero_de_0_a_100,
  "observacoes": "detalhes_se_necessario"
}

TEXTO: "${textoLimpo}"

Responda APENAS com JSON válido:`;

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
            };        }
    }

    async extrairComRegex(texto) {
        const logPrefix = '[HYBRID_FALLBACK]';
        
        try {
            console.log(`${logPrefix} 🔄 Tentando extração híbrida (IA + regex)...`);
            console.log(`${logPrefix} 📝 Texto para processamento:`, texto);
            
            const textoLimpo = texto.toLowerCase().trim();
            
            // 1. PRIMEIRA TENTATIVA: Usar IA para interpretar quantidade
            let quantidade = 100; // padrão
            
            try {
                console.log(`${logPrefix} 🤖 Tentando interpretação com IA...`);
                quantidade = await this.interpretarQuantidadeComIA(texto);
                console.log(`${logPrefix} ✅ IA detectou quantidade: ${quantidade}g`);
            } catch (iaError) {
                console.log(`${logPrefix} ⚠️ IA falhou, usando regex como backup:`, iaError.message);
                // Fallback para regex se IA não funcionar
                quantidade = this.interpretarQuantidadeComRegex(texto);
            }            
            // 2. EXTRAIR NOME DO ALIMENTO usando regex simples
            let nome = null;
            
            // Padrões simples para extrair nome do alimento
            const padroesSimplesAlimento = [
                /(?:de\s+)([a-záàâãéèêíìîóòôõúùûç]+(?:\s+[a-záàâãéèêíìîóòôõúùûç]+)*)/i,
                /(?:comi\s+(?:\d+\s*\w*\s+(?:de\s+)?)?)(banana|arroz|pão|feijão|frango|ovo|maçã|leite|queijo|tomate|batata|carne)/i,
                /(banana|arroz|pão|feijão|frango|ovo|maçã|leite|queijo|tomate|batata|carne)/i
            ];
            
            for (const padrao of padroesSimplesAlimento) {
                const match = textoLimpo.match(padrao);
                if (match) {
                    nome = match[1] || match[0];
                    console.log(`${logPrefix} 🎯 Alimento encontrado: "${nome}"`);
                    break;
                }
            }
            
            // Se não encontrou, usar lista de palavras-chave
            if (!nome) {
                const alimentosComuns = [
                    'arroz', 'feijão', 'pão', 'banana', 'maçã', 'frango', 'carne', 'ovo',
                    'leite', 'queijo', 'tomate', 'batata', 'alface', 'cenoura', 'massa'
                ];
                  nome = alimentosComuns.find(alimento => textoLimpo.includes(alimento));
                
                if (nome) {
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

    // Método específico para interpretar quantidades usando LLM
    async interpretarQuantidadeComIA(texto) {
        const logPrefix = '[QUANTIDADE_IA]';
        
        try {
            console.log(`${logPrefix} 🤖 Interpretando quantidade com IA...`);
            console.log(`${logPrefix} 📝 Texto: "${texto}"`);

            const prompt = `
Você é um especialista em interpretar quantidades de alimentos. Analise o texto e extraia APENAS a quantidade em gramas.

REGRAS:
1. Converta TUDO para gramas (g)
2. Use as conversões padrão abaixo
3. Responda APENAS com um número (sem texto, sem "g")
4. Se não conseguir identificar, responda "100"

CONVERSÕES PADRÃO:
- "um(a)", "uma", "1" = varia por alimento
- "dois", "duas", "2" = dobro da unidade
- "meio", "metade" = 50g padrão
- "cinquenta" = 50
- "cem", "100" = 100  
- "cento e cinquenta" = 150
- "duzentos", "200" = 200
- "trezentos" = 300
- "meio quilo" = 500
- "um quilo" = 1000

UNIDADES ESPECÍFICAS:
- "colher de sopa", "colher" = 15g por unidade
- "colheres" = 15g × quantidade
- "xícara", "xícaras" = 120g por unidade
- "copo", "copos" = 240g por unidade
- "fatia", "fatias" de pão = 25g por unidade
- "fatia", "fatias" queijo = 20g por unidade
- "unidade" banana = 120g
- "unidade" ovo = 50g
- "unidade" maçã = 150g
- "porção", "prato" = 100g padrão

EXEMPLOS:
"cinquenta gramas de arroz" → 50
"duas colheres de feijão" → 30
"uma fatia de pão" → 25
"três bananas" → 360
"duzentos gramas de frango" → 200
"meio copo de leite" → 120
"uma xícara de arroz" → 120

TEXTO: "${texto}"

Responda APENAS com o número em gramas:`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system", 
                        content: "Você é um especialista em converter quantidades de alimentos para gramas. Responda SEMPRE apenas com um número, sem texto adicional."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 50
            });

            const resposta = completion.choices[0].message.content.trim();
            const quantidade = parseInt(resposta);
            
            console.log(`${logPrefix} 📊 IA respondeu: "${resposta}" → ${quantidade}g`);
            
            if (isNaN(quantidade) || quantidade <= 0) {
                console.log(`${logPrefix} ⚠️ Resposta inválida, usando padrão 100g`);
                return 100;
            }
            
            return quantidade;
            
        } catch (error) {
            console.error(`${logPrefix} ❌ Erro na interpretação:`, error.message);
            // Fallback para regex se IA falhar
            return this.interpretarQuantidadeComRegex(texto);        }
    }

    // Método de fallback usando regex (mantido como backup)
    interpretarQuantidadeComRegex(texto) {
        const logPrefix = '[QUANTIDADE_REGEX]';
        console.log(`${logPrefix} 🔄 Usando fallback regex para: "${texto}"`);
        
        const textoLimpo = texto.toLowerCase().trim();
        
        // Regex para números por extenso
        const numerosTexto = {
            'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
            'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9,
            'dez': 10, 'quinze': 15, 'vinte': 20, 'trinta': 30, 'quarenta': 40,
            'cinquenta': 50, 'sessenta': 60, 'setenta': 70, 'oitenta': 80,
            'noventa': 90, 'cem': 100, 'duzentos': 200, 'trezentos': 300
        };
        
        // Procurar por números por extenso
        for (const [palavra, valor] of Object.entries(numerosTexto)) {
            if (textoLimpo.includes(palavra)) {
                console.log(`${logPrefix} 📊 Encontrado "${palavra}" = ${valor}`);
                
                // Verificar unidades
                if (textoLimpo.includes('grama')) {
                    return valor;
                } else if (textoLimpo.includes('colher')) {
                    return valor * 15;
                } else if (textoLimpo.includes('xícara') || textoLimpo.includes('xicara')) {
                    return valor * 120;
                } else if (textoLimpo.includes('copo')) {
                    return valor * 240;
                } else if (textoLimpo.includes('fatia')) {
                    return valor * 25;
                } else {
                    return valor; // assume gramas
                }
            }
        }
        
        // Regex para números diretos
        const match = textoLimpo.match(/(\d+)\s*(g|gramas?|kg|colher|fatia|copo)/i);
        if (match) {
            const valor = parseInt(match[1]);
            const unidade = match[2].toLowerCase();
            
            if (unidade.includes('kg')) return valor * 1000;
            if (unidade.includes('colher')) return valor * 15;
            if (unidade.includes('fatia')) return valor * 25;
            if (unidade.includes('copo')) return valor * 240;
            return valor;
        }
        
        console.log(`${logPrefix} ⚠️ Não conseguiu detectar quantidade, usando 100g`);
        return 100;
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