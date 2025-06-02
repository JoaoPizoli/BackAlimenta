const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Adicionando import do bcrypt
const router = express.Router();
const authMiddleware = require('./middleware/auth');
const knex = require('./database/connection'); // Adicionando import do knex

const Nutri = require('./models/nutri');
const Paciente = require('./models/paciente');
const Alimento = require('./models/alimento');
const Dieta = require('./models/dieta');
const RegistroDiario = require('./models/registroDiario');
const RegistroAlimentoDetalhado = require('./models/registroAlimentoDetalhado');

// Serviços para IA
const iaService = require('./services/iaService');
const MacroCalculatorService = require('./services/macroCalculatorService');
const macroCalculatorService = new MacroCalculatorService();

// Configuração do multer para upload de áudio - CORRIGIDA
const uploadPath = path.join(__dirname, 'uploads');

// Garantir que o diretório uploads existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('📁 Diretório uploads criado:', uploadPath);
}

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            // Manter o nome original ou gerar um único
            const uniqueName = file.originalname || `audio_${Date.now()}.wav`;
            console.log('💾 Salvando arquivo como:', uniqueName);
            cb(null, uniqueName);
        }
    }),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
    },
    fileFilter: (req, file, cb) => {
        console.log('🔍 Verificando arquivo:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        // Aceitar apenas arquivos de áudio
        if (file.mimetype.startsWith('audio/') || 
            file.originalname.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
            console.log('✅ Arquivo aceito');
            cb(null, true);
        } else {
            console.log('❌ Arquivo rejeitado');
            cb(new Error('Apenas arquivos de áudio são permitidos'), false);
        }
    }
});

// Rotas públicas
router.post('/nutri/register', async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    const nutri = new Nutri(nome, email, senha, telefone);
    const result = await nutri.createNutri();
    return res.json(result);
});

// Buscar meta do paciente - ROTA PÚBLICA (para tela inicial)
router.get('/public/meta/:paciente_id/:nutri_id/:data?', async (req, res) => {
    try {
        const { paciente_id, nutri_id, data } = req.params;
        
        console.log(`🎯 Buscando metas públicas para paciente ${paciente_id}, nutri ${nutri_id}, data ${data || 'hoje'}`);
        
        const dieta = new Dieta();
        const result = await dieta.pegarMacros(paciente_id, nutri_id, data);
        
        if (result.status && result.meta) {
            return res.json({
                success: true,
                meta: {
                    proteina: result.meta.proteina,
                    carbo: result.meta.carbo,
                    gordura: result.meta.gordura,
                    calorias: result.meta.calorias,
                    data: result.meta.data
                }
            });
        } else {
            // Se não há meta definida, retornar valores padrão
            return res.json({
                success: true,
                meta: {
                    proteina: 150,
                    carbo: 250,
                    gordura: 80,
                    calorias: 2000,
                    data: data || new Date().toISOString().split('T')[0]
                },
                isDefault: true,
                message: 'Meta padrão - nenhuma meta personalizada encontrada'
            });
        }
    } catch (error) {
        console.error('❌ Erro ao buscar meta pública:', error.message);
        
        // Em caso de erro, retornar valores padrão
        return res.json({
            success: true,
            meta: {
                proteina: 150,
                carbo: 250,
                gordura: 80,
                calorias: 2000,
                data: req.params.data || new Date().toISOString().split('T')[0]
            },
            isDefault: true,
            error: 'Erro ao buscar meta, usando valores padrão'
        });
    }
});

// ===== ROTAS DE AUTENTICAÇÃO =====
router.post('/auth/login', async (req, res) => {
    const { email, senha, tipo } = req.body;
    
    try {
        if (tipo === 'paciente') {
            const paciente = new Paciente();
            const result = await paciente.loginPaciente(email, senha);
            
            // Estruturar resposta para compatibilidade com Flutter
            if (result.status) {
                return res.json({
                    success: true,
                    data: {
                        id: result.paciente.paciente_id,
                        paciente_id: result.paciente.paciente_id,
                        nome: result.paciente.nome,
                        email: result.paciente.email,
                        token: result.token,
                        tipo: 'paciente'
                    }
                });
            } else {
                return res.json({
                    success: false,
                    error: result.message || result.error
                });
            }
        } else {
            // Default para nutricionista
            const nutri = new Nutri();
            const result = await nutri.loginNutri(email, senha);
            
            // Estruturar resposta para compatibilidade com Flutter
            if (result.status) {
                return res.json({
                    success: true,
                    data: {
                        id: result.nutri.nutri_id,
                        nutri_id: result.nutri.nutri_id,
                        nome: result.nutri.nome,
                        email: result.nutri.email,
                        token: result.token,
                        tipo: 'nutricionista'
                    }
                });
            } else {
                return res.json({
                    success: false,
                    error: result.message || result.error
                });
            }
        }
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        res.status(500).json({ success: false, error: 'Erro interno', details: error.message });
    }
});

router.post('/auth/login-nutri', async (req, res) => {
    const { email, senha } = req.body;
    const nutri = new Nutri();
    const result = await nutri.loginNutri(email, senha);
    
    // Estruturar resposta para compatibilidade com Flutter
    if (result.status) {
        return res.json({
            success: true,
            data: {
                id: result.nutri.nutri_id,
                nutri_id: result.nutri.nutri_id,
                nome: result.nutri.nome,
                email: result.nutri.email,
                token: result.token,
                tipo: 'nutricionista'
            }
        });
    } else {
        return res.json({
            success: false,
            error: result.message || result.error
        });
    }
});

// Manter rotas antigas para compatibilidade
router.post('/nutri/login', async (req, res) => {
    const { email, senha } = req.body;
    const nutri = new Nutri();
    const result = await nutri.loginNutri(email, senha);
    return res.json(result);
});

router.post('/paciente/login', async (req, res) => {
    const { email, senha } = req.body;
    const paciente = new Paciente();
    const result = await paciente.loginPaciente(email, senha);
    return res.json(result);
});

// Rota raiz com instruções
router.get('/', (req, res) => {
    res.json({
        message: 'Bem-vindo à API',
        instrucoes: {
            login: 'POST /nutri/login com email: admin@admin.com, senha: admin123',
            exemplo: {
                method: 'POST',
                url: '/nutri/login',
                body: {
                    email: 'admin@admin.com',
                    senha: 'admin123'
                }
            }
        }
    });
});

// 🎯 ROTA PÚBLICA: Buscar alimentos a partir de texto transcrito com IA Agent
router.post('/alimento/buscar-por-transcricao', async (req, res) => {
    try {
        const { texto_transcrito, limite } = req.body;
        
        // Validar entrada
        if (!texto_transcrito || typeof texto_transcrito !== 'string' || texto_transcrito.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Campo "texto_transcrito" é obrigatório e deve ser uma string não vazia',
                exemplo: {
                    texto_transcrito: "comi duas bananas e um pão",
                    limite: 10
                }
            });
        }

        const limiteInt = parseInt(limite) || 10;
        const textoLimpo = texto_transcrito.trim();
        
        console.log(`🔍 Processando transcrição com IA Agent: "${textoLimpo}"`);
        
        try {
            // 1. USAR IA AGENT para extrair alimento e quantidade do texto transcrito
            console.log(`🤖 Enviando para IA Agent: "${textoLimpo}"`);
            const extracao = await iaService.extrairAlimentoEQuantidade(textoLimpo);
            
            if (!extracao.status) {
                console.log(`❌ IA Agent falhou, usando busca simples`);
                // Fallback: busca simples se IA Agent falhar
                const alimento = new Alimento();
                const result = await alimento.searchAlimentosIA(textoLimpo, limiteInt);
                
                return res.json({
                    ...result,
                    ia_agent_usado: false,
                    busca_realizada: {
                        texto_original: texto_transcrito,
                        texto_processado: textoLimpo,
                        limite_resultados: limiteInt,
                        metodo: 'busca_simples_fallback',
                        timestamp: new Date().toISOString()
                    }
                });
            }
            
            console.log(`✅ IA Agent extraiu:`, extracao.dados);
            
            // 2. Buscar no banco usando o nome do alimento extraído pela IA
            const alimento = new Alimento();
            const alimentoExtraido = extracao.dados.nome.toLowerCase().trim();
            
            console.log(`🔍 Buscando no banco: "${alimentoExtraido}"`);
            const result = await alimento.searchAlimentosIA(alimentoExtraido, limiteInt);
              // 3. 🧮 NOVO: Calcular macros baseado na quantidade detectada
            let alimentosComMacros = result.alimentos;            if (result.status && result.alimentos && result.alimentos.length > 0) {
                console.log('\n🧮 ======= CALCULANDO MACROS =======');
                
                const alimentoPrincipal = result.alimentos[0];
                  try {
                    // Use quantidade detectada pela IA em vez de detectar novamente
                    const quantidadeIA = extracao.dados.quantidade;
                    
                    console.log(`🧮 Usando quantidade da IA: ${quantidadeIA}g`);
                    
                    const calculoMacros = await macroCalculatorService.calcularMacrosComQuantidadeIA(
                        alimentoPrincipal,
                        quantidadeIA
                    );
                    
                    if (calculoMacros.sucesso) {
                        // Substitui o primeiro alimento com os macros calculados
                        alimentosComMacros[0] = {
                            ...calculoMacros.macros_calculados,
                            informacoes_calculo: {
                                quantidade_detectada: calculoMacros.quantidade_detectada,
                                macros_originais: calculoMacros.macros_originais
                            }
                        };
                        
                        console.log('✅ Macros calculados e aplicados!');
                        console.log(`📊 Resultado: ${calculoMacros.macros_calculados.calorias}kcal para ${calculoMacros.quantidade_detectada.quantidade_final}g`);
                    }
                    
                } catch (calcError) {
                    console.error('❌ Erro no cálculo de macros:', calcError);
                    // Continua com os dados originais se o cálculo falhar
                }
            }

            // 4. Adicionar informações da IA Agent na resposta
            const response = {
                ...result,
                alimentos: alimentosComMacros,
                ia_agent_usado: true,
                ia_agent_resultado: {
                    alimento_extraido: extracao.dados.nome,
                    quantidade_extraida: extracao.dados.quantidade,
                    confianca: extracao.dados.confianca || null,
                    observacoes: extracao.dados.observacoes || null
                },
                busca_realizada: {
                    texto_original: texto_transcrito,
                    texto_processado: textoLimpo,
                    termo_busca_final: alimentoExtraido,
                    limite_resultados: limiteInt,
                    metodo: 'ia_agent_extraction',
                    timestamp: new Date().toISOString()
                }
            };
            
            // Log para debug
            if (result.status && result.alimentos) {
                console.log(`✅ Encontrados ${result.alimentos.length} alimentos para: "${alimentoExtraido}"`);
                result.alimentos.slice(0, 3).forEach((ali, idx) => {
                    console.log(`   ${idx + 1}. ${ali.nome} (${ali.calorias} kcal)`);
                });
            } else {
                console.log(`❌ Nenhum alimento encontrado para: "${alimentoExtraido}"`);
            }
            
            return res.json(response);
            
        } catch (iaError) {
            console.error('❌ Erro na IA Agent, usando busca simples:', iaError.message);
            
            // Fallback: busca simples em caso de erro na IA
            const alimento = new Alimento();
            const result = await alimento.searchAlimentosIA(textoLimpo, limiteInt);
            
            return res.json({
                ...result,
                ia_agent_usado: false,
                ia_agent_erro: iaError.message,
                busca_realizada: {
                    texto_original: texto_transcrito,
                    texto_processado: textoLimpo,
                    limite_resultados: limiteInt,
                    metodo: 'busca_simples_erro_ia',
                    timestamp: new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Erro geral na busca por transcrição:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor ao buscar alimentos',
            details: error.message 
        });
    }
});

// ===== ROTAS DE ALIMENTOS (SEM AUTENTICAÇÃO PARA TESTE) =====

// Rota para calcular macros sem autenticação (para testes)
router.post('/alimentos/calcular-macros', async (req, res) => {
    try {
        const { 
            nome_alimento, 
            quantidade, 
            paciente_id, 
            nutri_id, 
            tipo_refeicao, 
            observacoes 
        } = req.body;
        
        if (!nome_alimento || !quantidade || !paciente_id || !nutri_id) {
            return res.status(400).json({ 
                error: 'nome_alimento, quantidade, paciente_id e nutri_id são obrigatórios' 
            });
        }

        const opcoes = {
            tipo_refeicao: tipo_refeicao || 'outro',
            origem: 'manual',
            observacoes: observacoes || null
        };

        const resultado = await macroCalculatorService.calcularMacrosRefeicao(
            nome_alimento, 
            quantidade, 
            paciente_id, 
            nutri_id,
            opcoes
        );
        
        // Incluir resumo diário se o registro foi criado com sucesso
        if (resultado.status) {
            const resumoDiario = await macroCalculatorService.getResumoDiario(paciente_id);
            resultado.resumo_diario = resumoDiario;
        }
        
        res.json(resultado);

    } catch (error) {
        console.error('❌ Erro no cálculo:', error.message);
        res.status(500).json({ error: 'Erro no cálculo', details: error.message });
    }
});

// Buscar todos os alimentos detalhados por data (para persistência)
router.get('/alimentos-detalhados/data/:paciente_id', async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { data } = req.query;
        
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.buscarAlimentosPorData(paciente_id, data);
        
        if (result.status) {
            console.log(`✅ Encontrados ${result.total_itens} alimentos para ${data || 'hoje'}`);
            
            // Calcular totais por refeição para o Flutter
            const totaisPorRefeicao = {};
            Object.keys(result.refeicoes).forEach(tipoRefeicao => {
                const alimentos = result.refeicoes[tipoRefeicao];
                totaisPorRefeicao[tipoRefeicao] = {
                    total_calorias: alimentos.reduce((sum, item) => sum + (parseFloat(item.calorias_item) || 0), 0),
                    total_proteinas: alimentos.reduce((sum, item) => sum + (parseFloat(item.proteinas_item) || 0), 0),
                    total_carboidratos: alimentos.reduce((sum, item) => sum + (parseFloat(item.carboidratos_item) || 0), 0),
                    total_gordura: alimentos.reduce((sum, item) => sum + (parseFloat(item.gordura_item) || 0), 0),
                    alimentos: alimentos
                };
            });
            
            // Calcular totais gerais do dia
            const totaisGerais = {
                total_calorias: Object.values(totaisPorRefeicao).reduce((sum, refeicao) => sum + refeicao.total_calorias, 0),
                total_proteinas: Object.values(totaisPorRefeicao).reduce((sum, refeicao) => sum + refeicao.total_proteinas, 0),
                total_carboidratos: Object.values(totaisPorRefeicao).reduce((sum, refeicao) => sum + refeicao.total_carboidratos, 0),
                total_gordura: Object.values(totaisPorRefeicao).reduce((sum, refeicao) => sum + refeicao.total_gordura, 0)
            };
            
            return res.json({
                status: true,
                data: {
                    data: result.data,
                    paciente_id: result.paciente_id,
                    total_itens: result.total_itens,
                    totais_gerais: totaisGerais,
                    refeicoes: totaisPorRefeicao,
                    alimentos: result.refeicoes // manter compatibilidade
                }
            });
        }
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar alimentos detalhados:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Buscar alimentos de uma refeição específica
router.get('/alimentos-detalhados/refeicao/:paciente_id', async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { tipo_refeicao, data } = req.query;
        
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.buscarAlimentosPorRefeicao(paciente_id, tipo_refeicao, data);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar alimentos da refeição:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Remover um alimento específico
router.delete('/alimentos-detalhados/:registro_id', async (req, res) => {
    try {
        const { registro_id } = req.params;
        const { paciente_id } = req.query;
        
        if (!paciente_id) {
            return res.status(400).json({ error: 'paciente_id é obrigatório' });
        }
        
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.removerAlimento(registro_id, paciente_id);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao remover alimento:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Buscar resumo diário
router.get('/resumo-diario/:paciente_id', async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { data } = req.query;
        
        const resumoDiario = await macroCalculatorService.getResumoDiario(paciente_id, data);
        res.json(resumoDiario);
    } catch (error) {
        console.error('❌ Erro ao buscar resumo diário:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Rotas protegidas
router.use(authMiddleware);

// Rotas de Nutricionista
router.post('/paciente/register', async (req, res) => {
    const { nome, email, senha, telefone, peso, nutri_id } = req.body;
    const paciente = new Paciente(nome, email, senha, telefone, peso, nutri_id, true);
    const result = await paciente.createPaciente();
    return res.json(result);
});

router.get('/nutri/pacientes/:nutri_id', async (req, res) => {
    const paciente = new Paciente();
    const result = await paciente.buscarPacientesPorNutri(req.params.nutri_id);
    return res.json(result);
});

// Rota para atualizar dados do paciente
router.put('/pacientes/:paciente_id', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { name, email, phone } = req.body;
        
        console.log('📝 Atualizando paciente:', { 
            paciente_id, 
            paciente_id_type: typeof paciente_id,
            name, 
            email, 
            phone 
        });
        
        // Verificar se o paciente existe primeiro
        const pacienteExistente = await knex('paciente')
            .select(['paciente_id', 'nome', 'email'])
            .where({ paciente_id: parseInt(paciente_id) })
            .first();
            
        console.log('🔍 Paciente existente:', pacienteExistente);
        
        if (!pacienteExistente) {
            return res.status(404).json({ 
                status: false, 
                message: `Paciente com ID ${paciente_id} não encontrado` 
            });
        }
        
        const dadosParaAtualizar = {};
        if (name) dadosParaAtualizar.nome = name;
        if (email) dadosParaAtualizar.email = email;
        if (phone) dadosParaAtualizar.telefone = phone;
        
        console.log('📦 Dados para atualizar:', dadosParaAtualizar);
        
        const paciente = new Paciente();
        const result = await paciente.updatePaciente(parseInt(paciente_id), dadosParaAtualizar);
        
        console.log('✅ Resultado da atualização:', result);
        
        return res.json(result);
    } catch (error) {
        console.error('❌ Erro ao atualizar paciente:', error);
        return res.status(500).json({ status: false, message: 'Erro interno do servidor' });
    }
});

// Rota para alterar senha do paciente
router.post('/pacientes/alterar-senha', authMiddleware, async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        console.log('🔐 Dados recebidos:', { email, newPassword: newPassword ? '***' : 'undefined' });
        console.log('🔐 Tipo do email:', typeof email);
        
        if (!email || !newPassword) {
            console.log('❌ Dados incompletos:', { email: !!email, newPassword: !!newPassword });
            return res.status(400).json({ 
                status: false, 
                message: 'Email e nova senha são obrigatórios' 
            });
        }
        
        console.log('🔍 Buscando paciente com email:', email);
        
        // Buscar paciente pelo email
        const pacienteBusca = await knex('paciente')
            .select(['paciente_id', 'nome', 'email'])
            .where({ email })
            .first();
            
        console.log('🔍 Resultado da busca:', pacienteBusca);
        
        if (!pacienteBusca) {
            // Vamos verificar se existe algum paciente com email similar
            const emailsSimilares = await knex('paciente')
                .select(['email'])
                .whereRaw('LOWER(email) LIKE ?', [`%${email.toLowerCase()}%`])
                .limit(5);
                
            console.log('📧 Emails similares encontrados:', emailsSimilares);
            
            return res.status(400).json({ 
                status: false, 
                message: 'Paciente não encontrado' 
            });
        }
          // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Atualizar senha
        const paciente = new Paciente();
        const result = await paciente.updatePaciente(pacienteBusca.paciente_id, { 
            senha: hashedPassword 
        });
        
        if (result.status) {
            return res.json({ 
                status: true, 
                message: 'Senha alterada com sucesso' 
            });
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Erro ao alterar senha:', error);
        return res.status(500).json({ status: false, message: 'Erro interno do servidor' });
    }
});

// Rota para alterar status do paciente
router.put('/pacientes/:paciente_id/status', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { status } = req.body;
        
        console.log('📋 Alterando status do paciente:', { paciente_id, status });
        
        const ativo = status === 'active';
        const paciente = new Paciente();
        const result = await paciente.updatePaciente(paciente_id, { ativo });
        
        if (result.status) {
            return res.json({ 
                status: true, 
                message: `Paciente ${status === 'active' ? 'ativado' : 'desativado'} com sucesso` 
            });
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        return res.status(500).json({ status: false, message: 'Erro interno do servidor' });
    }
});

// Rota para remover paciente
router.delete('/pacientes/:paciente_id', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        
        console.log('🗑️ Removendo paciente:', { paciente_id });
        
        // Em vez de deletar, vamos desativar o paciente
        const paciente = new Paciente();
        const result = await paciente.updatePaciente(paciente_id, { ativo: false });
        
        if (result.status) {
            return res.json({ 
                status: true, 
                message: 'Paciente removido com sucesso' 
            });
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Erro ao remover paciente:', error);
        return res.status(500).json({ status: false, message: 'Erro interno do servidor' });
    }
});

// Rotas de Alimentos (SQLite In-Memory com dados TACO)
router.get('/alimento/search', async (req, res) => {
    const { nome } = req.query;
    if (!nome) {
        return res.status(400).json({ error: 'Parâmetro "nome" é obrigatório' });
    }
    
    const alimento = new Alimento();
    const result = await alimento.findAlimentoByNome(nome);
    return res.json(result);
});

// Nova rota para busca com IA
router.get('/alimento/search-ia', async (req, res) => {
    const { query, limit } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro "query" é obrigatório' });
    }
    
    const alimento = new Alimento();
    const result = await alimento.searchAlimentosIA(query, parseInt(limit) || 10);
    return res.json(result);
});

// Buscar alimento por ID
router.get('/alimento/:id', async (req, res) => {
    const { id } = req.params;
    const alimento = new Alimento();
    const result = await alimento.getAlimentoById(parseInt(id));
    return res.json(result);
});

// Listar todos os alimentos
router.get('/alimentos', async (req, res) => {
    const alimento = new Alimento();
    const result = await alimento.getAllAlimentos();
    return res.json(result);
});

// Estatísticas do banco de alimentos
router.get('/alimento/stats', async (req, res) => {
    const alimento = new Alimento();
    const result = await alimento.getEstatisticas();
    return res.json(result);
});

// ===== ROTAS DE IA E PROCESSAMENTO DE ÁUDIO =====
// REMOVIDAS: As rotas de transcrição de áudio foram removidas.
// Agora o Flutter faz transcrição local e envia apenas o texto transcrito.


// Rota para extrair alimento de texto
router.post('/ia/extrair-alimento', authMiddleware, async (req, res) => {
    try {
        const { texto } = req.body;
        
        if (!texto) {
            return res.status(400).json({ error: 'Texto é obrigatório' });
        }

        const resultado = await iaService.extrairAlimentoEQuantidade(texto);
        res.json(resultado);

    } catch (error) {
        console.error('❌ Erro na extração:', error.message);
        res.status(500).json({ error: 'Erro na extração', details: error.message });
    }
});

// Rota para calcular macros manualmente e registrar
router.post('/ia/calcular-macros', authMiddleware, async (req, res) => {
    try {
        const { 
            nome_alimento, 
            quantidade, 
            paciente_id, 
            nutri_id, 
            tipo_refeicao, 
            observacoes 
        } = req.body;
        
        if (!nome_alimento || !quantidade || !paciente_id || !nutri_id) {
            return res.status(400).json({ 
                error: 'nome_alimento, quantidade, paciente_id e nutri_id são obrigatórios' 
            });
        }

        const opcoes = {
            tipo_refeicao: tipo_refeicao || 'outro',
            origem: 'manual',
            observacoes: observacoes || null
        };

        const resultado = await macroCalculatorService.calcularMacrosRefeicao(
            nome_alimento, 
            quantidade, 
            paciente_id, 
            nutri_id,
            opcoes
        );
        
        // Incluir resumo diário se o registro foi criado com sucesso
        if (resultado.status) {
            const resumoDiario = await macroCalculatorService.getResumoDiario(paciente_id);
            resultado.resumo_diario = resumoDiario;
        }
        
        res.json(resultado);

    } catch (error) {
        console.error('❌ Erro no cálculo:', error.message);
        res.status(500).json({ error: 'Erro no cálculo', details: error.message });
    }
});

// Rota para buscar alimentos similares
router.get('/ia/alimentos-similares', authMiddleware, async (req, res) => {
    try {
        const { nome } = req.query;
        
        if (!nome) {
            return res.status(400).json({ error: 'Parâmetro "nome" é obrigatório' });
        }

        const resultado = await macroCalculatorService.buscarAlimentosSimilares(nome);
        res.json(resultado);

    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
        res.status(500).json({ error: 'Erro na busca', details: error.message });
    }
});

// ===== ROTAS DE REGISTRO DIÁRIO (TOTAIS) =====

// Buscar registro diário por paciente e data (totais do dia)
router.get('/registro-diario/:paciente_id/:data?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, data } = req.params;
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.buscarRegistroDia(paciente_id, data);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar registro:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Zerar registro do dia (reset)
router.delete('/registro-diario/:paciente_id/:data?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, data } = req.params;
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.zerarRegistroDia(paciente_id, data);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao zerar registro:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Buscar histórico de registros (últimos N dias)
router.get('/registro-diario/:paciente_id/historico/:dias?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, dias } = req.params;
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.buscarHistorico(paciente_id, parseInt(dias) || 7);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Obter resumo diário (meta vs consumo) - ROTA PRINCIPAL PARA O APP
router.get('/resumo-diario/:paciente_id/:data?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, data } = req.params;
        const result = await macroCalculatorService.getResumoDiario(paciente_id, data);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao calcular resumo:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Adicionar macros manualmente ao registro diário
router.post('/registro-diario/:paciente_id/adicionar', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { proteina, carboidrato, gordura, calorias, data } = req.body;
        
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.adicionarMacros(
            paciente_id, proteina, carboidrato, gordura, calorias, data
        );
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao adicionar macros:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Subtrair macros do registro diário
router.post('/registro-diario/:paciente_id/subtrair', authMiddleware, async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const { proteina, carboidrato, gordura, calorias, data } = req.body;
        
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.subtrairMacros(
            paciente_id, proteina, carboidrato, gordura, calorias, data
        );
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao subtrair macros:', error.message);        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// ===== ROTAS DE DIETA (METAS) =====

// Estatísticas de consumo do paciente
router.get('/registro-diario/:paciente_id/estatisticas/:dias?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, dias } = req.params;
        const registroDiario = new RegistroDiario();
        const result = await registroDiario.getEstatisticas(paciente_id, parseInt(dias) || 30);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao calcular estatísticas:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// ===== ROTAS DE DIETA (METAS) =====

// Criar/atualizar meta diária (apenas nutricionistas)
router.post('/dieta/meta', authMiddleware, async (req, res) => {
    const { proteina, carbo, gordura, calorias, paciente_id, nutri_id, data } = req.body;
    const dieta = new Dieta(proteina, carbo, gordura, calorias, paciente_id, nutri_id, data);
    const result = await dieta.createDieta();
    return res.json(result);
});

// Buscar meta do paciente para uma data específica
router.get('/dieta/meta/:paciente_id/:nutri_id/:data?', authMiddleware, async (req, res) => {
    const { paciente_id, nutri_id, data } = req.params;
    const dieta = new Dieta();
    const result = await dieta.pegarMacros(paciente_id, nutri_id, data);
    return res.json(result);
});

// Buscar histórico de metas
router.get('/dieta/historico/:paciente_id/:dias?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, dias } = req.params;
        const dieta = new Dieta();
        const result = await dieta.getHistoricoMetas(paciente_id, parseInt(dias) || 30);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Desativar meta
router.put('/dieta/desativar/:dieta_id/:paciente_id', authMiddleware, async (req, res) => {
    try {
        const { dieta_id, paciente_id } = req.params;
        const dieta = new Dieta();
        const result = await dieta.desativarMeta(dieta_id, paciente_id);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao desativar meta:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// ===== ROTAS DE IA E PROCESSAMENTO DE ÁUDIO (ATUALIZADAS) =====
// REMOVIDAS: As rotas de transcrição de áudio foram removidas.
// Agora o Flutter faz transcrição local e envia apenas o texto transcrito via /alimento/buscar-por-transcricao

// ===== ROTAS DE REGISTROS DETALHADOS POR ALIMENTO =====

// Buscar todos os alimentos consumidos em uma data específica (NOVA ROTA PARA RESOLVER PROBLEMA)
router.get('/registros-detalhados/:paciente_id/:data?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, data } = req.params;
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.buscarAlimentosPorData(paciente_id, data);
        
        if (result.status) {
            console.log(`✅ Encontrados ${result.total_itens} alimentos para ${data || 'hoje'}`);
        }
        
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar registros detalhados:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Buscar alimentos de uma refeição específica
router.get('/registros-detalhados/:paciente_id/refeicao/:tipo_refeicao/:data?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, tipo_refeicao, data } = req.params;
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.buscarAlimentosPorRefeicao(paciente_id, tipo_refeicao, data);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao buscar alimentos da refeição:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Remover um alimento específico
router.delete('/registros-detalhados/:registro_id/:paciente_id', authMiddleware, async (req, res) => {
    try {
        const { registro_id, paciente_id } = req.params;
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.removerAlimento(registro_id, paciente_id);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao remover alimento:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Obter estatísticas de consumo detalhadas
router.get('/registros-detalhados/:paciente_id/estatisticas/:dias?', authMiddleware, async (req, res) => {
    try {
        const { paciente_id, dias } = req.params;
        const registroDetalhado = new RegistroAlimentoDetalhado();
        const result = await registroDetalhado.obterEstatisticas(paciente_id, parseInt(dias) || 30);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas detalhadas:', error.message);
        res.status(500).json({ error: 'Erro interno', details: error.message });
    }
});

// Adicionar macros manualmente ao registro diário

module.exports = router;
