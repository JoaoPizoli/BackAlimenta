const knex = require('../database/connection');

class Dieta {
    constructor(proteina, carbo, gordura, calorias, paciente_id, nutri_id, data) {
        this.proteina = proteina;
        this.carbo = carbo;
        this.gordura = gordura;
        this.calorias = calorias;
        this.paciente_id = paciente_id;
        this.nutri_id = nutri_id;
        this.data = data || new Date().toISOString().split('T')[0]; // Default para hoje
    }    // Criar ou atualizar meta diária
    async createDieta() {
        try {
            console.log('🎯 Criando/atualizando meta diária!');
            
            // Verificar se já existe meta para essa data
            const existing = await knex('dieta')
                .select('dieta_id')
                .where({ paciente_id: this.paciente_id, data: this.data })
                .first();

            if (existing) {
                // Atualizar meta existente
                await knex('dieta')
                    .where({ paciente_id: this.paciente_id, data: this.data })
                    .update({
                        proteina: this.proteina,
                        carbo: this.carbo,
                        gordura: this.gordura,
                        calorias: this.calorias,
                        nutri_id: this.nutri_id,
                        updated_at: knex.fn.now()
                    });

                return { 
                    status: true, 
                    message: 'Meta diária atualizada com sucesso!',
                    dieta_id: existing.dieta_id,
                    acao: 'atualizada'
                };
            } else {
                // Criar nova meta
                const [dieta_id] = await knex('dieta').insert({
                    proteina: this.proteina,
                    carbo: this.carbo,
                    gordura: this.gordura,
                    calorias: this.calorias,
                    paciente_id: this.paciente_id,
                    nutri_id: this.nutri_id,
                    data: this.data                });

                return { 
                    status: true, 
                    message: 'Meta diária criada com sucesso!',
                    dieta_id: dieta_id,
                    acao: 'criada'
                };
            }

        } catch (error) {
            console.error(`❌ Erro ao registrar meta diária: ${error.message}`);
            return { status: false, error: error.message };
        }
    }// Buscar meta diária do paciente
    async pegarMacros(paciente_id, nutri_id = null, data = null) {
        try {
            console.log(`🔍 Buscando meta para paciente ${paciente_id}, data: ${data || 'hoje'}`);
            
            const dataConsulta = data || new Date().toISOString().split('T')[0];
            
            // Buscar meta usando knex (mais recente ou para a data específica)
            let query = knex('dieta')
                .select(['proteina', 'carbo', 'gordura', 'calorias', 'data', 'dieta_id'])
                .where('paciente_id', paciente_id)
                .where('data', '<=', dataConsulta);
            
            if (nutri_id) {
                query = query.where('nutri_id', nutri_id);
            }
            
            const rows = await query.orderBy('data', 'desc').limit(1);
            
            if (rows.length > 0) {
                console.log('✅ Meta encontrada:', rows[0]);
                return { 
                    status: true, 
                    dieta: rows[0],
                    message: 'Meta encontrada'
                };
            } else {
                console.log('❌ Nenhuma meta encontrada');
                return { 
                    status: false, 
                    message: 'Nenhuma meta encontrada para este paciente',
                    dieta: { proteina: 0, carbo: 0, gordura: 0, calorias: 0 }
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar meta diária:', error.message);
            return { status: false, error: error.message };
        }
    }

    // Buscar histórico de metas
    async getHistoricoMetas(paciente_id, dias = 30) {
        try {
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);
            const dataInicioStr = dataInicio.toISOString().split('T')[0];
            
            const connection = await db.connection();
            const [rows] = await connection.execute(`
                SELECT * FROM dieta 
                WHERE paciente_id = ? AND data >= ?
                ORDER BY data DESC
            `, [paciente_id, dataInicioStr]);
            
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

    // Desativar meta (soft delete)
    async desativarMeta(dieta_id, paciente_id) {
        try {
            const connection = await db.connection();
            const [result] = await connection.execute(`
                UPDATE dieta SET ativo = FALSE 
                WHERE dieta_id = ? AND paciente_id = ?
            `, [dieta_id, paciente_id]);
            
            if (result.affectedRows === 0) {
                return { 
                    status: false, 
                    message: 'Meta não encontrada ou não pertence ao paciente' 
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

}

module.exports = Dieta;

