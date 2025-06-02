const knex = require('../database/connection'); // Certifique-se de que o caminho está correto

class Dieta {
    constructor(proteina, carbo, gordura, calorias, paciente_id, nutri_id, data) {
        this.proteina = proteina;
        this.carbo = carbo;
        this.gordura = gordura;
        this.calorias = calorias;
        this.paciente_id = paciente_id;
        this.nutri_id = nutri_id;
        this.data = data || new Date().toISOString().split('T')[0]; // Default para hoje (YYYY-MM-DD)
    }

    /**
     * Cria uma nova meta diária ou atualiza uma existente para uma data específica.
     * Ideal para o cenário onde o nutricionista define uma meta para um dia X.
     * @returns {Promise<Object>} Objeto com status, mensagem, e dieta_id.
     */
    async createDieta() {
        try {
            console.log('🎯 Tentando criar/atualizar meta diária para uma data específica!');

            // Verificar se já existe meta para essa data específica e paciente
            const existing = await knex('dieta')
                .select('dieta_id')
                .where({ paciente_id: this.paciente_id, data: this.data })
                .first();

            if (existing) {
                // Se existir, atualiza a meta existente para aquela data
                await knex('dieta')
                    .where({ paciente_id: this.paciente_id, data: this.data })
                    .update({
                        proteina: this.proteina,
                        carbo: this.carbo,
                        gordura: this.gordura,
                        calorias: this.calorias,
                        nutri_id: this.nutri_id,
                        updated_at: knex.fn.now() // Adiciona o timestamp de atualização
                    });

                return {
                    status: true,
                    message: 'Meta diária para a data especificada atualizada com sucesso!',
                    dieta_id: existing.dieta_id,
                    acao: 'atualizada'
                };
            } else {
                // Se não existir, cria uma nova meta para aquela data
                const [dieta_id] = await knex('dieta').insert({
                    proteina: this.proteina,
                    carbo: this.carbo,
                    gordura: this.gordura,
                    calorias: this.calorias,
                    paciente_id: this.paciente_id,
                    nutri_id: this.nutri_id,
                    data: this.data,
                    created_at: knex.fn.now(), // Adiciona o timestamp de criação
                    updated_at: knex.fn.now() // Adiciona o timestamp de atualização
                });

                return {
                    status: true,
                    message: 'Nova meta diária criada com sucesso para a data especificada!',
                    dieta_id: dieta_id,
                    acao: 'criada'
                };
            }

        } catch (error) {
            console.error(`❌ Erro ao registrar meta diária: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    /**
     * Busca a meta diária mais recente para um paciente, opcionalmente filtrando por nutricionista ou data.
     * @param {number} paciente_id - ID do paciente.
     * @param {number} [nutri_id=null] - ID do nutricionista (opcional).
     * @param {string} [data=null] - Data no formato 'YYYY-MM-DD' para buscar a meta mais recente até aquela data (opcional).
     * @returns {Promise<Object>} Objeto com status, dieta (se encontrada), e mensagem.
     */
    async pegarMacros(paciente_id, nutri_id = null, data = null) {
        try {
            const dataConsulta = data || new Date().toISOString().split('T')[0];
            console.log(`🔍 Buscando meta para paciente ${paciente_id}, data: ${dataConsulta}`);

            let query = knex('dieta')
                .select(['proteina', 'carbo', 'gordura', 'calorias', 'data', 'dieta_id'])
                .where('paciente_id', paciente_id)
                .where('data', '<=', dataConsulta); // Pega a meta mais recente até a data informada

            if (nutri_id) {
                query = query.where('nutri_id', nutri_id);
            }

            const rows = await query.orderBy('data', 'desc').limit(1); // Ordena pela data mais recente e pega a primeira

            if (rows.length > 0) {
                console.log('✅ Meta encontrada:', rows[0]);
                return {
                    status: true,
                    dieta: rows[0],
                    message: 'Meta encontrada'
                };
            } else {
                console.log('❌ Nenhuma meta encontrada para este paciente ou data.');
                return {
                    status: false,
                    message: 'Nenhuma meta encontrada para este paciente',
                    dieta: { proteina: 0, carbo: 0, gordura: 0, calorias: 0 } // Retorna valores padrão caso não encontre
                };
            }

        } catch (error) {
            console.error('❌ Erro ao buscar meta diária:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Busca o histórico de metas diárias de um paciente em um período.
     * @param {number} paciente_id - ID do paciente.
     * @param {number} [dias=30] - Número de dias para buscar o histórico.
     * @returns {Promise<Object>} Objeto com status, histórico de dietas, e período.
     */
    async getHistoricoMetas(paciente_id, dias = 30) {
        try {
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);
            const dataInicioStr = dataInicio.toISOString().split('T')[0];

            const rows = await knex('dieta')
                .select('*')
                .where('paciente_id', paciente_id)
                .andWhere('data', '>=', dataInicioStr)
                .orderBy('data', 'desc');

            return {
                status: true,
                historico: rows,
                periodo_dias: dias
            };

        } catch (error) {
            console.error('❌ Erro ao buscar histórico:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Desativa uma meta diária específica (soft delete).
     * Requer que a tabela 'dieta' tenha uma coluna 'ativo' (BOOLEAN, default TRUE).
     * @param {number} dieta_id - ID da meta a ser desativada.
     * @param {number} paciente_id - ID do paciente para verificar a propriedade.
     * @returns {Promise<Object>} Objeto com status e mensagem.
     */
    async desativarMeta(dieta_id, paciente_id) {
        try {
            // Usa knex para a atualização
            const result = await knex('dieta')
                .where({ dieta_id: dieta_id, paciente_id: paciente_id })
                .update({ ativo: false, updated_at: knex.fn.now() });

            if (result === 0) { // Knex update retorna o número de linhas afetadas
                return {
                    status: false,
                    message: 'Meta não encontrada ou não pertence ao paciente.'
                };
            }

            return {
                status: true,
                message: 'Meta desativada com sucesso!'
            };

        } catch (error) {
            console.error('❌ Erro ao desativar meta:', error.message);
            return { status: false, error: error.message };
        }
    }

    /**
     * Atualiza a meta de macronutrientes do paciente.
     * Se uma meta existir para o paciente (a mais recente), ela é atualizada.
     * Caso contrário, uma nova meta é criada para a data atual.
     * Esta é a função que você deve usar para definir ou ajustar a meta *geral* do paciente.
     * @param {number} paciente_id - ID do paciente.
     * @param {number} proteina - Gramas de proteína.
     * @param {number} carbo - Gramas de carboidrato.
     * @param {number} gordura - Gramas de gordura.
     * @param {number} calorias - Total de calorias.
     * @param {number} nutri_id - ID do nutricionista que está definindo a meta.
     * @returns {Promise<Object>} Objeto com status, mensagem, e dieta_id.
     */
    async updatePatientMacros(paciente_id, proteina, carbo, gordura, calorias, nutri_id) {
        try {
            console.log('🎯 Tentando atualizar/criar macros para o paciente:', { paciente_id, proteina, carbo, gordura, calorias });

            // Busca a meta mais recente do paciente.
            // Isso garante que estamos sempre editando a "meta atual" do paciente.
            const latestMeta = await knex('dieta')
                .select(['dieta_id', 'data'])
                .where({ paciente_id: paciente_id })
                // .andWhere('ativo', true) // Descomente se você tiver uma coluna 'ativo' e quiser considerar apenas metas ativas
                .orderBy('data', 'desc') // Ordena para pegar a mais recente
                .first(); // Pega apenas a primeira (a mais recente)

            if (latestMeta) {
                // Se uma meta mais recente existir, a atualizamos.
                console.log('📝 Atualizando a meta existente (ID:', latestMeta.dieta_id, ') para o paciente', paciente_id);

                await knex('dieta')
                    .where({ dieta_id: latestMeta.dieta_id })
                    .update({
                        proteina: proteina,
                        carbo: carbo,
                        gordura: gordura,
                        calorias: calorias,
                        nutri_id: nutri_id,
                        updated_at: knex.fn.now() // Atualiza o timestamp
                    });

                return {
                    status: true,
                    message: 'Macros do paciente atualizados com sucesso!',
                    dieta_id: latestMeta.dieta_id,
                    acao: 'atualizada'
                };
            } else {
                // Se nenhuma meta existir para o paciente, cria uma nova para a data atual.
                console.log('➕ Nenhuma meta encontrada para o paciente', paciente_id, '. Criando nova meta para hoje.');

                const today = new Date().toISOString().split('T')[0];
                const [dieta_id] = await knex('dieta').insert({
                    proteina: proteina,
                    carbo: carbo,
                    gordura: gordura,
                    calorias: calorias,
                    paciente_id: paciente_id,
                    nutri_id: nutri_id,
                    data: today, // A nova meta é para a data atual
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                });

                return {
                    status: true,
                    message: 'Macros do paciente criados com sucesso!',
                    dieta_id: dieta_id,
                    acao: 'criada'
                };
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar/criar macros do paciente:', error.message);
            return { status: false, error: error.message };
        }
    }

}

module.exports = Dieta;