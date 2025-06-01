const Alimento = require('../models/alimento');
const RegistroDiario = require('../models/registroDiario');

class MacroCalculatorService {
    constructor() {
        this.alimentoModel = new Alimento();
        this.conversoes = {
            // Conversões aproximadas para 100g
            'colher de sopa': 15,
            'colher': 15,
            'colheres': 15,
            'xícara': 120,
            'xicaras': 120,
            'copo': 240,
            'copos': 240,
            'fatia': 30,
            'fatias': 30,
            'unidade': 50,
            'unidades': 50,
            'pedaço': 50,
            'pedaços': 50,
            'porção': 100,
            'porções': 100,
            'prato': 150,
            'pratos': 150,
            'tigela': 200,
            'tigelas': 200
        };
    }

    async calcularMacrosRefeicao(nomeAlimento, quantidadeConsumida, paciente_id, nutri_id, opcoes = {}) {
        try {
            console.log(`🧮 Calculando macros para: ${nomeAlimento} (${quantidadeConsumida}g)`);

            // 1. Buscar alimento no banco in-memory
            const resultadoBusca = await this.alimentoModel.searchAlimentosIA(nomeAlimento, 5);
            
            if (!resultadoBusca.status || resultadoBusca.alimentos.length === 0) {
                return { 
                    status: false, 
                    error: `Alimento "${nomeAlimento}" não encontrado na base de dados TACO` 
                };
            }

            // Pegar o primeiro resultado (mais relevante)
            const alimento = resultadoBusca.alimentos[0];
            console.log('🥗 Alimento encontrado:', alimento.nome);

            // 2. Calcular macros proporcionais
            // Dados da TACO são para 100g, calcular proporção
            const fatorProporcao = quantidadeConsumida / 100;
              const macrosCalculados = {
                calorias: Math.round((alimento.calorias || 0) * fatorProporcao * 100) / 100,
                proteinas: Math.round((alimento.proteinas || 0) * fatorProporcao * 100) / 100,
                carboidratos: Math.round((alimento.carboidratos || 0) * fatorProporcao * 100) / 100,
                gordura: Math.round((alimento.gordura || 0) * fatorProporcao * 100) / 100
            };
            
            console.log('📊 Macros calculados:', macrosCalculados);
            
            // 3. Registrar no total diário
            const registroDiario = new RegistroDiario();
            const resultadoRegistro = await registroDiario.adicionarMacros(
                paciente_id,
                macrosCalculados.calorias,
                macrosCalculados.proteinas,
                macrosCalculados.carboidratos,
                macrosCalculados.gordura,
                opcoes.data_consumo,
                `${alimento.nome} - ${quantidadeConsumida}g`
            );

            if (!resultadoRegistro.status) {
                return { 
                    status: false, 
                    error: 'Erro ao registrar consumo: ' + resultadoRegistro.error 
                };
            }

            const resultado = {
                status: true,
                alimento_encontrado: {
                    id: alimento.id,
                    nome: alimento.nome,
                    categoria: alimento.categoria || 'N/A'
                },
                quantidade_consumida: quantidadeConsumida,
                macros_calculados: macrosCalculados,
                dados_originais_100g: {
                    calorias: alimento.calorias,
                    proteinas: alimento.proteinas,
                    carboidratos: alimento.carboidratos,
                    gordura: alimento.gordura
                },                registro_criado: {
                    registro_id: resultadoRegistro.registro_id,
                    data_consumo: opcoes.data_consumo || new Date().toISOString().split('T')[0],
                    hora_consumo: opcoes.hora_consumo || new Date().toTimeString().split(' ')[0],
                    tipo_refeicao: opcoes.tipo_refeicao || 'outro',
                    origem: opcoes.origem || 'ia_audio'
                }
            };

            console.log('✅ Cálculo e registro concluídos!');
            return resultado;

        } catch (error) {
            console.error('❌ Erro no cálculo de macros:', error.message);
            return { status: false, error: error.message };
        }
    }    // Método para obter resumo diário (meta vs consumo)
    async getResumoDiario(paciente_id, data = null) {
        try {
            const dataConsulta = data || new Date().toISOString().split('T')[0];
            
            // Usar apenas o registroDiario que já busca metas corretamente
            const registroDiario = new RegistroDiario();
            const resultado = await registroDiario.buscarRegistroDia(paciente_id, dataConsulta);
            
            if (!resultado.status) {
                return { status: false, error: 'Erro ao buscar dados do paciente' };
            }

            // Os dados já vêm estruturados do registroDiario
            const dados = resultado.data;
            
            const restante = {
                proteina: Math.max(0, dados.meta.proteina - dados.consumo.proteina),
                carboidrato: Math.max(0, dados.meta.carboidrato - dados.consumo.carboidrato),
                gordura: Math.max(0, dados.meta.gordura - dados.consumo.gordura),
                kcal: Math.max(0, dados.meta.kcal - dados.consumo.kcal)
            };

            const percentual = {
                proteina: dados.meta.proteina > 0 ? Math.round((dados.consumo.proteina / dados.meta.proteina) * 100) : 0,
                carboidrato: dados.meta.carboidrato > 0 ? Math.round((dados.consumo.carboidrato / dados.meta.carboidrato) * 100) : 0,
                gordura: dados.meta.gordura > 0 ? Math.round((dados.consumo.gordura / dados.meta.gordura) * 100) : 0,
                kcal: dados.meta.kcal > 0 ? Math.round((dados.consumo.kcal / dados.meta.kcal) * 100) : 0
            };

            return {
                status: true,
                data: {
                    data: dados.data,
                    paciente_id: dados.paciente_id,
                    meta: {
                        kcal: parseFloat(dados.meta.kcal) || 0,
                        proteina: parseFloat(dados.meta.proteina) || 0,
                        carboidrato: parseFloat(dados.meta.carboidrato) || 0,
                        gordura: parseFloat(dados.meta.gordura) || 0
                    },                    consumo: {
                        kcal: dados.consumo.kcal || 0,
                        proteina: dados.consumo.proteina || 0,
                        carboidrato: dados.consumo.carboidrato || 0,
                        gordura: dados.consumo.gordura || 0
                    },
                    restante: restante,
                    percentuais: percentual
                }
            };        } catch (error) {
            console.error('❌ Erro ao calcular resumo diário:', error.message);
            return { status: false, error: error.message };
        }
    }

    async buscarAlimentosSimilares(nomeAlimento) {
        try {
            console.log(`🔍 Buscando alimentos similares a: ${nomeAlimento}`);
            
            const resultado = await this.alimentoModel.searchAlimentosIA(nomeAlimento, 10);
            
            if (resultado.status) {
                const sugestoes = resultado.alimentos.map(alimento => ({
                    id: alimento.id,
                    nome: alimento.nome,
                    categoria: alimento.categoria,
                    calorias_100g: alimento.calorias
                }));

                return { status: true, sugestoes };
            }

            return { status: false, message: 'Nenhum alimento similar encontrado' };

        } catch (error) {
            console.error('❌ Erro na busca de similares:', error.message);
            return { status: false, error: error.message };
        }
    }

    calcularIMC(peso, altura) {
        try {
            const imc = peso / (altura * altura);
            let classificacao = '';

            if (imc < 18.5) classificacao = 'Abaixo do peso';
            else if (imc < 25) classificacao = 'Peso normal';
            else if (imc < 30) classificacao = 'Sobrepeso';
            else classificacao = 'Obesidade';

            return {
                status: true,
                imc: Math.round(imc * 100) / 100,
                classificacao
            };
        } catch (error) {
            return { status: false, error: 'Erro no cálculo do IMC' };
        }
    }

    // 🆕 NOVO MÉTODO: Calcular macros a partir de texto transcrito
    async calcularMacrosComTexto(textoTranscrito, dadosAlimento) {
        try {
            console.log('[MACRO_CALC] 🧮 Iniciando cálculo de macros...');
            console.log('[MACRO_CALC] 📝 Texto:', textoTranscrito);
            console.log('[MACRO_CALC] 🥗 Alimento:', dadosAlimento.nome);

            // Detecta a quantidade no texto
            const quantidadeDetectada = this.extrairQuantidade(textoTranscrito);
            
            // Calcula os macros baseado na quantidade
            const macrosCalculados = this.aplicarQuantidade(dadosAlimento, quantidadeDetectada);

            console.log('[MACRO_CALC] ✅ Cálculo concluído:', {
                quantidade_detectada: quantidadeDetectada,
                macros_originais: `${dadosAlimento.calorias}kcal (100g)`,
                macros_calculados: `${macrosCalculados.calorias}kcal (${quantidadeDetectada.quantidade_final}g)`
            });

            return {
                quantidade_detectada: quantidadeDetectada,
                macros_originais: this.extrairMacrosOriginais(dadosAlimento),
                macros_calculados: macrosCalculados,
                sucesso: true
            };

        } catch (error) {
            console.error('[MACRO_CALC] ❌ Erro no cálculo:', error);
            // Retorna dados originais em caso de erro
            return {
                quantidade_detectada: { valor: 100, unidade: 'g', fator_multiplicacao: 1 },
                macros_calculados: this.extrairMacrosOriginais(dadosAlimento),
                sucesso: false,
                erro: error.message
            };
        }
    }

    // 🆕 NOVO MÉTODO: Calcular macros com quantidade já detectada pela IA
    async calcularMacrosComQuantidadeIA(dadosAlimento, quantidadeIA) {
        try {
            console.log('[MACRO_CALC] 🧮 Iniciando cálculo com quantidade da IA...');
            console.log('[MACRO_CALC] 🥗 Alimento:', dadosAlimento.nome);
            console.log('[MACRO_CALC] 📏 Quantidade da IA:', quantidadeIA + 'g');

            // Usa a quantidade detectada pela IA
            const quantidadeDetectada = {
                valor_original: quantidadeIA + 'g',
                valor_numerico: quantidadeIA,
                unidade: 'g',
                quantidade_final: quantidadeIA,
                fator_multiplicacao: quantidadeIA / 100,
                confianca: 85, // Alta confiança pois veio da IA
                metodo: 'ia_detection'
            };
            
            // Calcula os macros baseado na quantidade
            const macrosCalculados = this.aplicarQuantidade(dadosAlimento, quantidadeDetectada);

            console.log('[MACRO_CALC] ✅ Cálculo concluído:', {
                quantidade_detectada: quantidadeDetectada,
                macros_originais: `${dadosAlimento.calorias}kcal (100g)`,
                macros_calculados: `${macrosCalculados.calorias}kcal (${quantidadeDetectada.quantidade_final}g)`
            });

            return {
                quantidade_detectada: quantidadeDetectada,
                macros_originais: this.extrairMacrosOriginais(dadosAlimento),
                macros_calculados: macrosCalculados,
                sucesso: true
            };

        } catch (error) {
            console.error('[MACRO_CALC] ❌ Erro no cálculo:', error);
            // Retorna dados originais em caso de erro
            return {
                quantidade_detectada: { valor: 100, unidade: 'g', fator_multiplicacao: 1 },
                macros_originais: this.extrairMacrosOriginais(dadosAlimento),
                macros_calculados: this.extrairMacrosOriginais(dadosAlimento),
                sucesso: false,
                erro: error.message
            };
        }
    }

    extrairQuantidade(textoTranscrito) {
        console.log('[MACRO_CALC] 🔍 Extraindo quantidade do texto:', textoTranscrito);

        // Limpa o texto para análise
        const textoLimpo = textoTranscrito.toLowerCase().trim();

        // Padrões para detectar quantidades
        const padroes = [
            // Números com unidades específicas (gramas, quilos)
            /(\d+(?:[.,]\d+)?)\s*(g|gramas?|quilos?|kg)\b/i,
            
            // Medidas caseiras
            /(\d+(?:[.,]\d+)?)\s*(colheres?(?:\s+de\s+sopa)?|xicaras?|copos?|fatias?|unidades?|pedaços?|pratos?|tigelas?)\b/i,
            
            // Frações e palavras
            /(meia|meio)\s*(xícara|copo|colher|fatia|porção)/i,
            /(uma?|dois?|duas|três|quatro|cinco|seis|sete|oito|nove|dez)\s*(colheres?|xicaras?|copos?|fatias?|unidades?|pedaços?)/i,
            
            // Apenas números no início (assume gramas)
            /^(\d+(?:[.,]\d+)?)\b/,
            
            // Números isolados com contexto
            /(\d+(?:[.,]\d+)?)\s*(?:de\s+)?(?:gramas?|g)?\s*(?:de\s+)?/i
        ];

        for (const padrao of padroes) {
            const match = textoLimpo.match(padrao);
            if (match) {
                let valor = this.converterNumeroTexto(match[1]) || parseFloat(match[1]?.replace(',', '.')) || 1;
                let unidade = (match[2] || 'g').toLowerCase().trim();

                // Tratamento especial para frações
                if (match[1] === 'meia' || match[1] === 'meio') {
                    valor = 0.5;
                }

                // Normaliza unidades
                unidade = this.normalizarUnidade(unidade);

                // Calcula quantidade em gramas
                const quantidadeEmGramas = this.converterParaGramas(valor, unidade);

                const resultado = {
                    valor_original: match[1],
                    valor_numerico: valor,
                    unidade: unidade,
                    quantidade_final: quantidadeEmGramas,
                    fator_multiplicacao: quantidadeEmGramas / 100,
                    confianca: this.calcularConfianca(match, unidade),
                    metodo: 'regex_avancado'
                };

                console.log('[MACRO_CALC] ✅ Quantidade extraída:', resultado);
                return resultado;
            }
        }

        // Fallback: assume 100g (porção padrão da tabela TACO)
        console.log('[MACRO_CALC] ⚠️ Quantidade não detectada, usando 100g padrão');
        return {
            valor_original: 'não detectado',
            valor_numerico: 100,
            unidade: 'g',
            quantidade_final: 100,
            fator_multiplicacao: 1,
            confianca: 30,
            metodo: 'fallback_100g'
        };
    }    converterNumeroTexto(texto) {
        const numeros = {
            // Números básicos
            'uma': 1, 'um': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
            'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8,
            'nove': 9, 'dez': 10, 'meia': 0.5, 'meio': 0.5,
            
            // Dezenas
            'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
            'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
            
            // Centenas
            'cem': 100, 'cento': 100, 'duzentos': 200, 'trezentos': 300,
            'quatrocentos': 400, 'quinhentos': 500, 'seiscentos': 600,
            'setecentos': 700, 'oitocentos': 800, 'novecentos': 900,
            
            // Números específicos comuns em alimentação
            'quinze': 15, 'vinte e cinco': 25, 'cinquenta': 50,
            'setenta e cinco': 75, 'cem': 100, 'cento e cinquenta': 150,
            'duzentos': 200, 'duzentos e cinquenta': 250, 'trezentos': 300
        };
        return numeros[texto?.toLowerCase()] || null;
    }

    normalizarUnidade(unidade) {
        const mapeamento = {
            'g': 'g', 'grama': 'g', 'gramas': 'g',
            'kg': 'kg', 'quilo': 'kg', 'quilos': 'kg',
            'colher': 'colher', 'colheres': 'colher', 'colher de sopa': 'colher',
            'xícara': 'xícara', 'xicaras': 'xícara', 'xicara': 'xícara', 'xicaras': 'xícara',
            'copo': 'copo', 'copos': 'copo',
            'fatia': 'fatia', 'fatias': 'fatia',
            'unidade': 'unidade', 'unidades': 'unidade',
            'pedaço': 'pedaço', 'pedaços': 'pedaço', 'pedaco': 'pedaço',
            'prato': 'prato', 'pratos': 'prato',
            'tigela': 'tigela', 'tigelas': 'tigela'
        };
        return mapeamento[unidade] || unidade;
    }

    converterParaGramas(valor, unidade) {
        if (unidade === 'kg') {
            return valor * 1000;
        }
        
        if (unidade === 'g') {
            return valor;
        }

        // Usa as conversões pré-definidas
        const conversao = this.conversoes[unidade];
        if (conversao) {
            return valor * conversao;
        }

        // Fallback: trata como gramas
        return valor;
    }

    calcularConfianca(match, unidade) {
        if (unidade === 'g' || unidade === 'kg') return 90;
        if (this.conversoes[unidade]) return 75;
        return 50;
    }

    aplicarQuantidade(dadosAlimento, quantidadeInfo) {
        const fator = quantidadeInfo.fator_multiplicacao;
        
        return {
            id: dadosAlimento.id,
            codigo: dadosAlimento.codigo,
            nome: dadosAlimento.nome,
            quantidade_consumida: `${quantidadeInfo.valor_numerico} ${quantidadeInfo.unidade}`,
            quantidade_em_gramas: quantidadeInfo.quantidade_final,
            calorias: Math.round(dadosAlimento.calorias * fator * 100) / 100,
            proteinas: Math.round(dadosAlimento.proteinas * fator * 100) / 100,
            carboidratos: Math.round(dadosAlimento.carboidratos * fator * 100) / 100,
            gordura: Math.round(dadosAlimento.gordura * fator * 100) / 100,
            fibra: Math.round((dadosAlimento.fibra || 0) * fator * 100) / 100,
            calcio: Math.round((dadosAlimento.calcio || 0) * fator * 100) / 100,
            ferro: Math.round((dadosAlimento.ferro || 0) * fator * 100) / 100,
            sodio: Math.round((dadosAlimento.sodio || 0) * fator * 100) / 100,
            categoria: dadosAlimento.categoria,
            created_at: dadosAlimento.created_at
        };
    }

    extrairMacrosOriginais(dadosAlimento) {
        return {
            calorias: dadosAlimento.calorias,
            proteinas: dadosAlimento.proteinas,
            carboidratos: dadosAlimento.carboidratos,
            gordura: dadosAlimento.gordura,
            fibra: dadosAlimento.fibra || 0,
            calcio: dadosAlimento.calcio || 0,
            ferro: dadosAlimento.ferro || 0,
            sodio: dadosAlimento.sodio || 0
        };
    }
}

module.exports = MacroCalculatorService;
