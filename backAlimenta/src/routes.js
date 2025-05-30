const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const authMiddleware = require('./middleware/auth');

const Nutri = require('./models/nutri');
const Paciente = require('./models/paciente');
const Alimento = require('./models/alimento');
const Dieta = require('./models/dieta');
const RegistroDiario = require('./models/registroDiario');

// Serviços para IA
const iaService = require('./services/iaService');
const macroCalculatorService = require('./services/macroCalculatorService');

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

// 🎯 ROTA PÚBLICA: Buscar alimentos a partir de texto transcrito
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
        const textoLimpo = texto_transcrito.trim().toLowerCase();
        
        console.log(`🔍 Buscando alimentos para transcrição: "${textoLimpo}"`);
        
        // Usar a classe Alimento para fazer a busca
        const alimento = new Alimento();
        const result = await alimento.searchAlimentosIA(textoLimpo, limiteInt);
        
        // Adicionar informações extras na resposta
        const response = {
            ...result,
            busca_realizada: {
                texto_original: texto_transcrito,
                texto_processado: textoLimpo,
                limite_resultados: limiteInt,
                timestamp: new Date().toISOString()
            }
        };
        
        // Log para debug
        if (result.status && result.alimentos) {
            console.log(`✅ Encontrados ${result.alimentos.length} alimentos para: "${textoLimpo}"`);
            result.alimentos.slice(0, 3).forEach((ali, idx) => {
                console.log(`   ${idx + 1}. ${ali.nome} (${ali.calorias} kcal)`);
            });
        } else {
            console.log(`❌ Nenhum alimento encontrado para: "${textoLimpo}"`);
        }
        
        return res.json(response);
        
    } catch (error) {
        console.error('❌ Erro na busca por transcrição:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor ao buscar alimentos',
            details: error.message 
        });
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

// Rota principal: Upload de áudio e processamento completo da refeição
router.post('/ia/processar-audio-refeicao', authMiddleware, upload.single('audio'), async (req, res) => {
    let arquivoAudio = null;
    
    try {
        const { paciente_id, nutri_id, tipo_refeicao, observacoes } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
        }
        
        if (!paciente_id || !nutri_id) {
            return res.status(400).json({ error: 'paciente_id e nutri_id são obrigatórios' });
        }        arquivoAudio = req.file;
        console.log('🎤 Arquivo de áudio recebido:', {
            originalname: arquivoAudio.originalname,
            mimetype: arquivoAudio.mimetype,
            size: arquivoAudio.size,
            path: arquivoAudio.path,
            fieldname: arquivoAudio.fieldname,
            encoding: arquivoAudio.encoding
        });

        // Verificar se o arquivo foi salvo corretamente
        if (!fs.existsSync(arquivoAudio.path)) {
            console.error('❌ Arquivo não encontrado no caminho:', arquivoAudio.path);
            return res.status(500).json({ 
                error: 'Arquivo não foi salvo corretamente',
                details: `Caminho: ${arquivoAudio.path}`
            });
        }

        const stats = fs.statSync(arquivoAudio.path);
        console.log('📊 Estatísticas do arquivo salvo:', {
            tamanho: stats.size,
            criado: stats.birthtime,
            modificado: stats.mtime
        });// 1. Transcrever áudio - CORREÇÃO: passar o objeto audioFile completo
        const transcricao = await iaService.transcribeAudio(arquivoAudio);
        
        if (!transcricao.status) {
            return res.status(500).json({ 
                error: 'Erro na transcrição do áudio', 
                details: transcricao.error 
            });
        }

        // 2. Extrair alimento e quantidade
        const extracao = await iaService.extrairAlimentoEQuantidade(transcricao.texto);
        
        if (!extracao.status) {
            return res.status(500).json({ 
                error: 'Erro na extração de informações', 
                details: extracao.error,
                transcricao: transcricao.texto
            });
        }

        // 3. Calcular macros e registrar no banco
        const opcoes = {
            tipo_refeicao: tipo_refeicao || 'outro',
            origem: 'ia_audio',
            confianca_ia: extracao.dados.confianca,
            transcricao_original: transcricao.texto,
            observacoes: observacoes || null
        };

        const calculo = await macroCalculatorService.calcularMacrosRefeicao(
            extracao.dados.nome,
            extracao.dados.quantidade,
            paciente_id,
            nutri_id,
            opcoes
        );

        if (!calculo.status) {
            return res.status(500).json({ 
                error: 'Erro no cálculo de macros', 
                details: calculo.error,
                transcricao: transcricao.texto,
                extracao: extracao.dados
            });
        }

        // 4. Obter resumo diário atualizado
        const resumoDiario = await macroCalculatorService.getResumoDiario(paciente_id);

        // 5. Resposta completa
        const resposta = {
            status: true,
            processamento: {
                transcricao: transcricao.texto,
                alimento_extraido: extracao.dados,
                calculo_macros: calculo,
                resumo_diario: resumoDiario
            },
            message: 'Refeição processada e registrada com sucesso!'
        };

        res.json(resposta);

    } catch (error) {
        console.error('❌ Erro no processamento:', error.message);
        res.status(500).json({ 
            error: 'Erro interno no processamento', 
            details: error.message 
        });
    } finally {
        // Limpar arquivo temporário
        if (arquivoAudio && fs.existsSync(arquivoAudio.path)) {
            fs.unlinkSync(arquivoAudio.path);
        }
    }
});

// Rota para transcrição simples (sem processamento)
router.post('/ia/transcrever-audio', authMiddleware, upload.single('audio'), async (req, res) => {
    let arquivoAudio = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
        }

        arquivoAudio = req.file;
        const transcricao = await iaService.transcribeAudio(fs.createReadStream(arquivoAudio.path));
        
        res.json(transcricao);

    } catch (error) {
        console.error('❌ Erro na transcrição:', error.message);
        res.status(500).json({ error: 'Erro na transcrição', details: error.message });
    } finally {
        if (arquivoAudio && fs.existsSync(arquivoAudio.path)) {
            fs.unlinkSync(arquivoAudio.path);
        }
    }
});

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

// Rota alternativa: Processar áudio enviado como base64 (para desktop/web)
router.post('/ia/processar-audio-refeicao-base64', authMiddleware, async (req, res) => {
    let arquivoTemporario = null;
    
    try {
        const { audio_base64, paciente_id, nutri_id, tipo_refeicao, observacoes } = req.body;
        
        if (!audio_base64) {
            return res.status(400).json({ error: 'audio_base64 é obrigatório' });
        }
          if (!paciente_id || !nutri_id) {
            return res.status(400).json({ error: 'paciente_id e nutri_id são obrigatórios' });
        }

        // Converter base64 para arquivo temporário
        const audioBuffer = Buffer.from(audio_base64, 'base64');
        const tempPath = path.join(__dirname, '../uploads', `temp_audio_${Date.now()}.wav`);
        fs.writeFileSync(tempPath, audioBuffer);
        arquivoTemporario = tempPath;
        
        console.log('🎤 Arquivo de áudio base64 convertido:', tempPath);

        // 1. Transcrever áudio
        const transcricao = await iaService.transcribeAudio(fs.createReadStream(tempPath));
        
        if (!transcricao.status) {
            return res.status(500).json({ 
                error: 'Erro na transcrição do áudio', 
                details: transcricao.error 
            });
        }

        // 2. Extrair alimento e quantidade
        const extracao = await iaService.extrairAlimentoEQuantidade(transcricao.texto);
        
        if (!extracao.status) {
            return res.status(500).json({ 
                error: 'Erro na extração de informações', 
                details: extracao.error,
                transcricao: transcricao.texto
            });
        }

        // 3. Calcular macros e registrar no banco
        const opcoes = {
            tipo_refeicao: tipo_refeicao || 'outro',
            origem: 'ia_audio_base64',
            confianca_ia: extracao.dados.confianca,
            transcricao_original: transcricao.texto,
            observacoes: observacoes || null
        };

        const calculo = await macroCalculatorService.calcularMacrosRefeicao(
            extracao.dados.nome,
            extracao.dados.quantidade,
            paciente_id,
            nutri_id,
            opcoes
        );

        if (!calculo.status) {
            return res.status(500).json({ 
                error: 'Erro no cálculo de macros', 
                details: calculo.error,
                transcricao: transcricao.texto,
                extracao: extracao.dados
            });
        }

        // 4. Obter resumo diário atualizado
        const resumoDiario = await macroCalculatorService.getResumoDiario(paciente_id);

        // 5. Resposta completa
        const resposta = {
            status: true,
            processamento: {
                transcricao: transcricao.texto,
                alimento_extraido: extracao.dados,
                calculo_macros: calculo,
                resumo_diario: resumoDiario
            },
            message: 'Refeição processada e registrada com sucesso!'
        };

        res.json(resposta);

    } catch (error) {
        console.error('❌ Erro no processamento base64:', error.message);
        res.status(500).json({ 
            error: 'Erro interno no processamento', 
            details: error.message 
        });
    } finally {
        // Limpar arquivo temporário
        if (arquivoTemporario && fs.existsSync(arquivoTemporario)) {
            fs.unlinkSync(arquivoTemporario);
        }
    }
});

module.exports = router;
