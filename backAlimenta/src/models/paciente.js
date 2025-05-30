const knex = require('../database/connection')
const bcrypt = require('bcryptjs')
const generateToken = require('../utils/generateToken')

class Paciente{
    constructor(nome, email, senha, telefone, peso, nutri_id, ativo){
        this.nome = nome
        this.email = email
        this.senha = senha 
        this.telefone = telefone
        this.peso = peso 
        this.nutri_id = nutri_id
        this.ativo = ativo
    }

    async createPaciente(){
        try {
            console.log('Criando Paciente')
            
            const hashedPassword = await bcrypt.hash(this.senha, 10)
            
            const [resultado] = await knex('paciente').insert({
                nome: this.nome,
                email: this.email,
                senha: hashedPassword,
                telefone: this.telefone,
                peso: this.peso,
                nutri_id: this.nutri_id,
                ativo: this.ativo
            }).returning(['paciente_id', 'nome', 'email', 'telefone', 'peso', 'nutri_id', 'ativo'])

            const token = generateToken({ id: resultado.paciente_id })

            return { 
                status: true, 
                paciente: resultado,
                token 
            }
        }      
        catch (error) {    
            console.error('Erro ao criar Paciente', error.message)
            return { status: false, error: error.message }
        }
    }

    async findPacienteById(id){
        try {
        console.log('Procurando Paciente pelo ID')

        const paciente = await knex('paciente')
        .select(['paciente_id','nome','email','senha','telefone','peso','nutri_id','ativo'])
        .where({id: id})

        return paciente.length > 0 
            ? {status: true, paciente: paciente[0]}
            :{status: false, message: 'Paciente não encontrado por ID'}
        } catch (err) {
            console.error(`Erro ao buscar paciente: ${err.message}`);
            return { status: false, err: err.message };
        }
    }

    async mudarStatusPorId(id) {    
    try {
        console.log(`Iniciando mudança de status para o ID: ${id}`);

        const pacienteAtual = await knex('paciente')
            .select(['ativo']) 
            .where({ paciente_id: id })

        if (pacienteAtual) {
            const novoStatus = !pacienteAtual.ativo;
            const acao = novoStatus ? "Verdadeiro" : "Falso";

            console.log(`Paciente ID ${id} encontrado. Status atual: ${pacienteAtual.ativo}. Alterando para ${acao}.`);
            await knex('paciente')
                .update({ ativo: novoStatus })
                .where({ id: id }); 

            console.log(`Status do paciente ID ${id} alterado para ${acao}!`);
            return { success: true, message: `Status do paciente ID ${id} alterado para ${acao}.` };

        } else {
            console.log(`Paciente com ID ${id} não encontrado.`);
            return { success: false, message: `Paciente com ID ${id} não encontrado.` }; 
        }

        } catch (err) {
          console.error(`Erro ao alterar o Status do Paciente ID ${id}: ${err.message}`);
          return { success: false, error: err.message }; 
        }
    }

    async buscarPacientePorNutri(nutri_id){
        console.log('Buscando Paciente pelo Id da Nutricionista')

        try {
            const paciente = await knex('paciente')
            .select(['nome','email','senha','telefone','peso','ativo'])
            .where({nutri_id: nutri_id})

            return paciente.length > 0 
                ? {status: true, paciente: paciente[0]}
                :{status: false, message: 'Paciente não encontrado pelo Id da Nutricionista'}
        } catch (err) {
            console.error(`Erro ao buscar paciente pelo Id da Nutricionista: ${err.message}`);
            return { status: false, err: err.message };
        }
    }

    async buscarPacientesPorNutri(nutri_id){
        console.log('Buscando TODOS os Pacientes pelo Id da Nutricionista')

        try {
            const pacientes = await knex('paciente')
            .select(['paciente_id', 'nome','email','telefone','peso','ativo', 'nutri_id'])
            .where({nutri_id: nutri_id, ativo: true})

            return pacientes.length > 0 
                ? {status: true, pacientes: pacientes}
                :{status: false, message: 'Nenhum paciente encontrado para esta nutricionista', pacientes: []}
        } catch (err) {
            console.error(`Erro ao buscar pacientes pelo Id da Nutricionista: ${err.message}`);
            return { status: false, error: err.message };
        }
    }

    async loginPaciente(email, senha) {
        try {
            console.log(`Tentativa de login do paciente: ${email}`);

            const paciente = await knex('paciente')
                .select(['paciente_id', 'nome', 'email', 'telefone', 'peso', 'nutri_id', 'ativo', 'senha'])
                .where({ email })
                .first();

            if (!paciente) {
                return { status: false, message: 'Paciente não encontrado' };
            }

            if (!await bcrypt.compare(senha, paciente.senha)) {
                return { status: false, message: 'Senha inválida' };
            }

            if (!paciente.ativo) {
                return { status: false, message: 'Conta do paciente está inativa' };
            }

            delete paciente.senha;
            const token = generateToken({ id: paciente.paciente_id });

            return { 
                status: true, 
                paciente,
                token 
            };
        } catch (error) {
            console.error(`Erro no login do paciente: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    async updatePaciente(paciente_id, dadosParaAtualizar) {
        try {
            console.log(`Atualizando paciente ID: ${paciente_id}`);
            
            const resultado = await knex('paciente')
                .where({ paciente_id })
                .update(dadosParaAtualizar)
                .returning(['paciente_id', 'nome', 'email', 'telefone', 'peso', 'ativo']);

            if (resultado.length > 0) {
                return { status: true, paciente: resultado[0] };
            } else {
                return { status: false, message: 'Paciente não encontrado' };
            }
        } catch (error) {
            console.error(`Erro ao atualizar paciente: ${error.message}`);
            return { status: false, error: error.message };
        }
    }
}

module.exports = Paciente;