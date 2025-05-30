const Alimento = require('../models/alimento');
const RegistroDiario = require('../models/registroDiario');

class MacroCalculatorService {
    constructor() {
        this.alimentoModel = new Alimento();
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
}

module.exports = new MacroCalculatorService();
