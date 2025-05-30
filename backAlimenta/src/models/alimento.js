const alimentoService = require('../services/alimentoInMemoryService');

class Alimento {
    constructor(nome, calorias, proteinas, carbo, gordura){
        this.nome = nome
        this.calorias = calorias
        this.proteinas = proteinas
        this.carbo = carbo 
        this.gordura = gordura
    }

    // NOTA: Métodos de inserção, atualização e deleção foram removidos
    // pois a tabela de alimentos agora é carregada do CSV TACO em modo read-only

    async findAlimentoByNome(nome) {
        try {
            console.log(`Procurando o Alimento pelo nome: ${nome}`);
            
            const alimentos = await alimentoService.searchAlimentos(nome, 20);
            
            console.log(`Busca concluída para: ${nome}. Encontrados: ${alimentos.length} resultados`);
            
            return alimentos.length > 0
                ? { status: true, alimento: alimentos }
                : { status: false, message: 'Alimento não encontrado!' };   
        } catch (err) {
            console.error(`Erro ao buscar Alimento: ${err.message}`);
            return { status: false, error: err.message };
        }
    }

    async getAllAlimentos() {
        try {
            console.log('Buscando todos os alimentos');
            const alimentos = await alimentoService.getAllAlimentos(100);
            
            return { status: true, alimentos };
        } catch (error) {
            console.error(`Erro ao buscar alimentos: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    // Método específico para busca com IA
    async searchAlimentosIA(query, limit = 10) {
        try {
            console.log(`Busca IA para: ${query}`);
            const alimentos = await alimentoService.searchAlimentos(query, limit);
            
            return alimentos.length > 0
                ? { status: true, alimentos }
                : { status: false, message: 'Nenhum alimento encontrado para a busca.' };
        } catch (error) {
            console.error(`Erro na busca IA: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    // Método para obter alimento por ID
    async getAlimentoById(id) {
        try {
            console.log(`Buscando alimento por ID: ${id}`);
            const alimento = await alimentoService.getAlimentoById(id);
            
            return alimento
                ? { status: true, alimento }
                : { status: false, message: 'Alimento não encontrado.' };
        } catch (error) {
            console.error(`Erro ao buscar alimento por ID: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    // Método para obter estatísticas do banco
    async getEstatisticas() {
        try {
            const count = await alimentoService.getAlimentoCount();
            return { 
                status: true, 
                estatisticas: {
                    total_alimentos: count,
                    tipo_banco: 'SQLite In-Memory',
                    fonte: 'Tabela TACO'
                }
            };
        } catch (error) {
            console.error(`Erro ao obter estatísticas: ${error.message}`);
            return { status: false, error: error.message };
        }
    }
}

module.exports = Alimento;
