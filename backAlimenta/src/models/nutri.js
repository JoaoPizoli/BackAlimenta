const knex = require('../database/connection')
const bcrypt = require('bcryptjs')
const generateToken = require('../utils/generateToken')


class Nutri { 
    constructor(nome, email, senha, telefone){
        this.nome = nome
        this.email = email
        this.senha = senha
        this.telefone = telefone 
    }

    async createNutri(){
        try {
            console.log('Criando Nutricionista!')
            
            const hashedPassword = await bcrypt.hash(this.senha, 10)
            
            const [resultado] = await knex('nutri').insert({
                nome: this.nome,
                email: this.email,
                senha: hashedPassword,
                telefone: this.telefone
            }).returning(['nutri_id', 'nome', 'email', 'telefone'])

            const token = generateToken({ id: resultado.nutri_id })

            return { 
                status: true, 
                nutri: resultado,
                token 
            }
        } catch (error) {
            console.error(`Erro ao criar Nutricionista: ${error.message}`);
            return { status: false, error: error.message }
        }
    }


    async findNutriByEmail(email){
        try {
            console.log(`Procurando nutri pelo email: ${email}`);

            const nutri = await knex('nutri')
            .select(['nutri_id','nome','email','telefone'])
            .where({email: email})

            console.log(`Nutricionista encontrado: ${JSON.stringify(nutri)}`);

            return nutri.length > 0
            ? { status: true, nutri: nutri[0] }
            : { status: false, message: 'Nutricionista não encontrado' };

        } catch (err) {
            console.error(`Erro ao buscar Nutricionista: ${err.message}`);
            return { status: false, err: err.message };
        }
    }

    async findNutriById(nutri_id) {
        try {
            console.log(`Procurando nutri pelo ID: ${nutri_id}`);

            const nutri = await knex('nutri')
                .select(['nutri_id', 'nome', 'email', 'telefone', 'data_criacao'])
                .where({ nutri_id })
                .first();

            if (nutri) {
                return { status: true, nutri };
            } else {
                return { status: false, message: 'Nutricionista não encontrado' };
            }
        } catch (error) {
            console.error(`Erro ao buscar Nutricionista por ID: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    async loginNutri(email, senha) {
        try {
            console.log(`Tentativa de login para: ${email}`);

            const nutri = await knex('nutri')
                .select(['nutri_id', 'nome', 'email', 'telefone', 'senha'])
                .where({ email })
                .first();

            if (!nutri) {
                return { status: false, message: 'Nutricionista não encontrado' };
            }

            if (!await bcrypt.compare(senha, nutri.senha)) {
                return { status: false, message: 'Senha inválida' };
            }

            delete nutri.senha;
            const token = generateToken({ id: nutri.nutri_id });

            return { 
                status: true, 
                nutri,
                token 
            };
        } catch (error) {
            console.error(`Erro no login: ${error.message}`);
            return { status: false, error: error.message };
        }
    }

    async updateNutri(nutri_id, dadosParaAtualizar) {
        try {
            console.log(`Atualizando nutricionista ID: ${nutri_id}`);
            
            const resultado = await knex('nutri')
                .where({ nutri_id })
                .update(dadosParaAtualizar)
                .returning(['nutri_id', 'nome', 'email', 'telefone']);

            if (resultado.length > 0) {
                return { status: true, nutri: resultado[0] };
            } else {
                return { status: false, message: 'Nutricionista não encontrado' };
            }
        } catch (error) {
            console.error(`Erro ao atualizar nutricionista: ${error.message}`);
            return { status: false, error: error.message };
        }
    }
}

module.exports = Nutri;