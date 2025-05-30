const knex = require('../database/connection');

class RegistroDiario {
    constructor() {
        // Constructor vazio - métodos utilizam parâmetros
    }

    /**
     * Buscar resumo do dia (meta vs consumo)
     */
    async buscarRegistroDia(paciente_id, data = null) {
        try {
            console.log(`Buscando registro diário para paciente ${paciente_id}, data: ${data || 'hoje'}`);
            
            const hoje = data || new Date().toISOString().split('T')[0];
              // Buscar meta do dia
            const meta = await knex('dieta')
                .select(['calorias', 'proteina', 'carbo', 'gordura'])
                .where({ paciente_id })
                .where('data', '<=', hoje)
                .orderBy('data', 'desc')
                .first();

            // Buscar consumo do dia na tabela registro_diario
            const consumo = await knex('registro_diario')
                .select([
                    'proteina_total',
                    'carboidrato_total', 
                    'gordura_total',
                    'calorias_total'
                ])
                .where({ paciente_id, data_registro: hoje })
                .first();            // Estruturar resposta
            const resultado = {
                data: hoje,
                paciente_id: parseInt(paciente_id),
                meta: {
                    kcal: meta?.calorias || 0,
                    proteina: meta?.proteina || 0,
                    carboidrato: meta?.carbo || 0,
                    gordura: meta?.gordura || 0
                },
                consumo: {
                    kcal: parseFloat(consumo?.calorias_total || 0),
                    proteina: parseFloat(consumo?.proteina_total || 0),
                    carboidrato: parseFloat(consumo?.carboidrato_total || 0),
                    gordura: parseFloat(consumo?.gordura_total || 0)
                }
            };

            // Calcular percentuais
            resultado.percentuais = {
                kcal: resultado.meta.kcal > 0 ? Math.round((resultado.consumo.kcal / resultado.meta.kcal) * 100) : 0,
                proteina: resultado.meta.proteina > 0 ? Math.round((resultado.consumo.proteina / resultado.meta.proteina) * 100) : 0,
                carboidrato: resultado.meta.carboidrato > 0 ? Math.round((resultado.consumo.carboidrato / resultado.meta.carboidrato) * 100) : 0,
                gordura: resultado.meta.gordura > 0 ? Math.round((resultado.consumo.gordura / resultado.meta.gordura) * 100) : 0
            };

            console.log('✅ Registro diário encontrado:', resultado);
            return { status: true, data: resultado };

        } catch (error) {
            console.error('❌ Erro ao buscar registro diário:', error.message);
            return { status: false, error: error.message };
        }
    }    /**
     * Adicionar macros ao registro do dia (atualizar totais)
     */
    async adicionarMacros(paciente_id, kcal, proteina, carboidrato, gordura, data = null, descricao = null) {
        try {
            console.log(`Adicionando macros para paciente ${paciente_id}:`, { kcal, proteina, carboidrato, gordura });
            
            const hoje = data || new Date().toISOString().split('T')[0];
            
            // Verificar se já existe registro para hoje
            const registroExistente = await knex('registro_diario')
                .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                .first();

            if (registroExistente) {
                // Atualizar totais existentes (somar aos valores atuais)
                await knex('registro_diario')
                    .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                    .update({
                        calorias_total: knex.raw('calorias_total + ?', [parseFloat(kcal)]),
                        proteina_total: knex.raw('proteina_total + ?', [parseFloat(proteina)]),
                        carboidrato_total: knex.raw('carboidrato_total + ?', [parseFloat(carboidrato)]),
                        gordura_total: knex.raw('gordura_total + ?', [parseFloat(gordura)]),
                        updated_at: new Date()
                    });

                console.log('✅ Totais atualizados (somados aos existentes)');
            } else {
                // Criar novo registro com os valores iniciais
                await knex('registro_diario').insert({
                    paciente_id: parseInt(paciente_id),
                    data_registro: hoje,
                    calorias_total: parseFloat(kcal),
                    proteina_total: parseFloat(proteina),
                    carboidrato_total: parseFloat(carboidrato),
                    gordura_total: parseFloat(gordura),
                    created_at: new Date(),
                    updated_at: new Date()
                });

                console.log('✅ Novo registro diário criado');
            }

            return { status: true, data_registro: hoje };

        } catch (error) {
            console.error('❌ Erro ao adicionar macros:', error.message);
            return { status: false, error: error.message };
        }
    }    /**
     * Subtrair macros do registro do dia (reduzir totais)
     */
    async subtrairMacros(paciente_id, kcal, proteina, carboidrato, gordura, data = null) {
        try {
            console.log(`Subtraindo macros para paciente ${paciente_id}:`, { kcal, proteina, carboidrato, gordura });
            
            const hoje = data || new Date().toISOString().split('T')[0];
            
            // Verificar se existe registro para hoje
            const registroExistente = await knex('registro_diario')
                .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                .first();

            if (registroExistente) {
                // Subtrair dos totais existentes (não permitir valores negativos)
                await knex('registro_diario')
                    .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                    .update({
                        calorias_total: knex.raw('GREATEST(0, calorias_total - ?)', [parseFloat(kcal)]),
                        proteina_total: knex.raw('GREATEST(0, proteina_total - ?)', [parseFloat(proteina)]),
                        carboidrato_total: knex.raw('GREATEST(0, carboidrato_total - ?)', [parseFloat(carboidrato)]),
                        gordura_total: knex.raw('GREATEST(0, gordura_total - ?)', [parseFloat(gordura)]),
                        updated_at: new Date()
                    });

                console.log('✅ Macros subtraídos dos totais');
            } else {
                console.log('⚠️ Nenhum registro encontrado para subtrair');
            }

            return { status: true, data_registro: hoje };

        } catch (error) {
            console.error('❌ Erro ao subtrair macros:', error.message);
            return { status: false, error: error.message };
        }
    }    /**
     * Zerar registro do dia (resetar totais para zero)
     */
    async zerarRegistroDia(paciente_id, data = null) {
        try {
            console.log(`Zerando registro do dia para paciente ${paciente_id}`);
            
            const hoje = data || new Date().toISOString().split('T')[0];
            
            // Verificar se existe registro
            const registroExistente = await knex('registro_diario')
                .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                .first();

            if (registroExistente) {
                // Resetar totais para zero
                await knex('registro_diario')
                    .where({ paciente_id: parseInt(paciente_id), data_registro: hoje })
                    .update({
                        calorias_total: 0,
                        proteina_total: 0,
                        carboidrato_total: 0,
                        gordura_total: 0,
                        updated_at: new Date()
                    });

                console.log('✅ Registro zerado (totais resetados para 0)');
                return { status: true, acao: 'zerado' };
            } else {
                console.log('⚠️ Nenhum registro encontrado para zerar');
                return { status: true, acao: 'nenhum_registro' };
            }

        } catch (error) {
            console.error('❌ Erro ao zerar registro:', error.message);
            return { status: false, error: error.message };
        }
    }    /**
     * Obter histórico de registros
     */
    async obterHistorico(paciente_id, dias = 7) {
        try {
            console.log(`Buscando histórico de ${dias} dias para paciente ${paciente_id}`);
            
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);
            const dataInicioStr = dataInicio.toISOString().split('T')[0];
            
            const registros = await knex('registro_diario')
                .select([
                    'data_registro as data',
                    'calorias_total as kcal_total',
                    'proteina_total',
                    'carboidrato_total',
                    'gordura_total'
                ])
                .where('paciente_id', parseInt(paciente_id))
                .where('data_registro', '>=', dataInicioStr)
                .orderBy('data_registro', 'desc');

            console.log(`✅ ${registros.length} dias encontrados no histórico`);
            return { status: true, historico: registros };

        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error.message);
            return { status: false, error: error.message };
        }
    }
}

module.exports = RegistroDiario;
