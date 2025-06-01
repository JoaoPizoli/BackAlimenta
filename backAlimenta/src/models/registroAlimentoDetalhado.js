const db = require('../database/connection');

/**
 * Modelo para gerenciar registros detalhados de alimentos consumidos
 * Permite salvar/recuperar cada alimento individual por refeição e data
 */
class RegistroAlimentoDetalhado {
    constructor() {
        // Constructor vazio - métodos utilizam parâmetros
        
        // Mapeamento de tipos de refeição
        this.mapeamentoRefeicoes = {
            'Café da Manhã': 'cafe_manha',
            'Café da manha': 'cafe_manha',
            'café da manhã': 'cafe_manha',
            'café da manha': 'cafe_manha',
            'cafe da manha': 'cafe_manha',
            'cafe_manha': 'cafe_manha',
            'Almoço': 'almoco',
            'Almoco': 'almoco',
            'almoço': 'almoco',
            'almoco': 'almoco',
            'Lanche': 'lanches',
            'Lanches': 'lanches',
            'lanche': 'lanches',
            'lanches': 'lanches',
            'Janta': 'janta',
            'Jantar': 'janta',
            'janta': 'janta',
            'jantar': 'janta',
            'Outro': 'outro',
            'outro': 'outro'
        };
    }

    /**
     * Mapear tipo de refeição para o valor do banco
     */
    mapearTipoRefeicao(tipoRefeicao) {
        return this.mapeamentoRefeicoes[tipoRefeicao] || 'outro';
    }

    /**
     * Adicionar um alimento consumido (registro individual)
     */
    async adicionarAlimento({
        paciente_id,
        data_consumo = null,
        hora_consumo = null,
        tipo_refeicao = 'outro',
        alimento_nome,
        alimento_id_memory = null,
        quantidade_gramas,
        calorias_item,
        proteinas_item,
        carboidratos_item,
        gordura_item,
        origem_registro = 'manual',
        observacoes = null,
        confianca_ia = null
    }) {
        try {
            console.log(`📝 Adicionando registro detalhado: ${alimento_nome} (${quantidade_gramas}g)`);
              const hoje = data_consumo || new Date().toISOString().split('T')[0];
            const agora = hora_consumo || new Date().toTimeString().split(' ')[0];
            const tipoRefeicaoMapeado = this.mapearTipoRefeicao(tipo_refeicao);

            const [registro_id] = await db('registro_alimento_detalhado').insert({
                paciente_id: parseInt(paciente_id),
                data_consumo: hoje,
                hora_consumo: agora,
                tipo_refeicao: tipoRefeicaoMapeado,
                alimento_nome,
                alimento_id_memory,
                quantidade_gramas: parseFloat(quantidade_gramas),
                calorias_item: parseFloat(calorias_item),
                proteinas_item: parseFloat(proteinas_item),
                carboidratos_item: parseFloat(carboidratos_item),
                gordura_item: parseFloat(gordura_item),
                origem_registro,
                observacoes,
                confianca_ia,
                created_at: new Date(),
                updated_at: new Date()
            });

            console.log(`✅ Registro detalhado criado com ID: ${registro_id}`);
            return { 
                status: true, 
                registro_id,
                message: 'Alimento registrado com sucesso'
            };

        } catch (error) {
            console.error('❌ Erro ao adicionar registro detalhado:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Buscar todos os alimentos consumidos em uma data específica
     */
    async buscarAlimentosPorData(paciente_id, data = null) {
        try {
            const dataConsulta = data || new Date().toISOString().split('T')[0];
            console.log(`🔍 Buscando alimentos consumidos em ${dataConsulta} para paciente ${paciente_id}`);            const registros = await db('registro_alimento_detalhado')
                .select([
                    'registro_id',
                    'data_consumo',
                    'hora_consumo', 
                    'tipo_refeicao',
                    'alimento_nome',
                    'quantidade_gramas',
                    'calorias_item',
                    'proteinas_item',
                    'carboidratos_item',
                    'gordura_item',
                    'origem_registro',
                    'observacoes',
                    'confianca_ia',
                    'created_at'
                ])
                .where('paciente_id', parseInt(paciente_id))
                .where('data_consumo', dataConsulta)
                .orderBy(['tipo_refeicao', 'hora_consumo', 'created_at']);

            // Agrupar por tipo de refeição
            const refeicoesPorTipo = {
                cafe_manha: [],
                almoco: [],
                lanches: [],
                janta: [],
                outro: []
            };

            registros.forEach(registro => {
                const tipo = registro.tipo_refeicao || 'outro';
                if (refeicoesPorTipo[tipo]) {
                    refeicoesPorTipo[tipo].push({
                        ...registro,
                        quantidade_gramas: parseFloat(registro.quantidade_gramas),
                        calorias_item: parseFloat(registro.calorias_item),
                        proteinas_item: parseFloat(registro.proteinas_item),
                        carboidratos_item: parseFloat(registro.carboidratos_item),
                        gordura_item: parseFloat(registro.gordura_item)
                    });
                }
            });

            console.log(`✅ Encontrados ${registros.length} alimentos em ${dataConsulta}`);
            return { 
                status: true, 
                data: dataConsulta,
                paciente_id: parseInt(paciente_id),
                total_itens: registros.length,
                refeicoes: refeicoesPorTipo
            };

        } catch (error) {
            console.error('❌ Erro ao buscar alimentos por data:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Buscar alimentos de uma refeição específica
     */
    async buscarAlimentosPorRefeicao(paciente_id, tipo_refeicao, data = null) {
        try {
            const dataConsulta = data || new Date().toISOString().split('T')[0];
              const registros = await db('registro_alimento_detalhado')
                .select('*')
                .where({
                    paciente_id: parseInt(paciente_id),
                    data_consumo: dataConsulta,
                    tipo_refeicao
                })
                .orderBy(['hora_consumo', 'created_at']);

            return { 
                status: true, 
                refeicao: tipo_refeicao,
                data: dataConsulta,
                alimentos: registros
            };

        } catch (error) {
            console.error(`❌ Erro ao buscar alimentos da refeição ${tipo_refeicao}:`, error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Remover um alimento específico (por registro_id)
     */
    async removerAlimento(registro_id, paciente_id) {
        try {
            console.log(`🗑️ Removendo registro ${registro_id} do paciente ${paciente_id}`);            // Buscar o registro para logs
            const registro = await db('registro_alimento_detalhado')
                .where({ registro_id, paciente_id })
                .first();

            if (!registro) {
                return { status: false, error: 'Registro não encontrado' };
            }            // Remover o registro
            await db('registro_alimento_detalhado')
                .where({ registro_id, paciente_id })
                .del();

            console.log(`✅ Registro removido: ${registro.alimento_nome}`);
            return { 
                status: true, 
                message: 'Alimento removido com sucesso',
                alimento_removido: {
                    nome: registro.alimento_nome,
                    quantidade: parseFloat(registro.quantidade_gramas),
                    calorias: parseFloat(registro.calorias_item)
                }
            };

        } catch (error) {
            console.error('❌ Erro ao remover alimento:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Obter estatísticas do paciente (alimentos mais consumidos, etc.)
     */
    async obterEstatisticas(paciente_id, dias = 30) {
        try {
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);
            const dataInicioStr = dataInicio.toISOString().split('T')[0];            // Alimentos mais consumidos
            const alimentosMaisConsumidos = await db('registro_alimento_detalhado')
                .select('alimento_nome')
                .count('* as frequencia')
                .sum('quantidade_gramas as quantidade_total')
                .where('paciente_id', parseInt(paciente_id))
                .where('data_consumo', '>=', dataInicioStr)
                .groupBy('alimento_nome')
                .orderBy('frequencia', 'desc')
                .limit(10);            // Distribuição por tipo de refeição
            const distribuicaoPorRefeicao = await db('registro_alimento_detalhado')
                .select('tipo_refeicao')
                .count('* as total_itens')
                .sum('calorias_item as total_calorias')
                .where('paciente_id', parseInt(paciente_id))
                .where('data_consumo', '>=', dataInicioStr)
                .groupBy('tipo_refeicao')
                .orderBy('total_calorias', 'desc');

            return {
                status: true,
                periodo_dias: dias,
                alimentos_mais_consumidos: alimentosMaisConsumidos,
                distribuicao_por_refeicao: distribuicaoPorRefeicao
            };

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Limpar todos os registros de uma data específica
     */
    async limparRegistrosDia(paciente_id, data = null) {
        try {
            const dataConsulta = data || new Date().toISOString().split('T')[0];
              const registrosRemovidos = await db('registro_alimento_detalhado')
                .where({ paciente_id: parseInt(paciente_id), data_consumo: dataConsulta })
                .del();

            console.log(`✅ ${registrosRemovidos} registros removidos de ${dataConsulta}`);
            return { 
                status: true, 
                registros_removidos: registrosRemovidos,
                data: dataConsulta
            };

        } catch (error) {
            console.error('❌ Erro ao limpar registros do dia:', error.message);
            return { status: false, error: error.message };
        }
    }
}

module.exports = RegistroAlimentoDetalhado;
