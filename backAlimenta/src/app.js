const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('./database/connection');

// Inicializar serviço de alimentos in-memory
const alimentoService = require('./services/alimentoInMemoryService');

const app = express();

app.use(cors());
app.use(express.json());

// Middleware de log para debug
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Inicializar banco in-memory de alimentos
async function initializeInMemoryDB() {
    try {
        console.log('🚀 Inicializando banco SQLite in-memory para alimentos...');
        await alimentoService.initialize();
        console.log('✅ Banco de alimentos in-memory inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco in-memory:', error.message);
    }
}

// Rota de documentação
app.get('/', (req, res) => {
    res.json({
        projeto: 'API Alimenta',
        versao: '2.0 - SQLite In-Memory para Alimentos',
        banco_alimentos: 'SQLite In-Memory com dados TACO',
        rotas: {
            public: {
                login: {
                    method: 'POST',
                    url: '/nutri/login',
                    body: { email: 'admin@admin.com', senha: 'admin123' }
                },
                registro: {
                    method: 'POST',
                    url: '/nutri/register',
                    body: { nome: 'string', email: 'string', senha: 'string', telefone: 'string' }
                }
            },            protected: {
                header: 'Authorization: Bearer <token>',
                pacientes: {
                    criar: 'POST /paciente/register',
                    listar: 'GET /nutri/pacientes/:nutri_id'
                },
                alimentos: {
                    buscar_nome: 'GET /alimento/search?nome=<nome>',
                    buscar_ia: 'GET /alimento/search-ia?query=<texto_livre>&limit=10',
                    por_id: 'GET /alimento/:id',
                    listar_todos: 'GET /alimentos',
                    estatisticas: 'GET /alimento/stats'
                },                dietas_metas: {
                    criar_meta: 'POST /dieta/meta',
                    buscar_meta: 'GET /dieta/meta/:paciente_id/:nutri_id/:data?',
                    historico: 'GET /dieta/historico/:paciente_id/:dias?',
                    desativar: 'PUT /dieta/desativar/:dieta_id/:paciente_id'
                },
                registro_diario: {
                    por_data: 'GET /registro-diario/:paciente_id/:data',
                    por_periodo: 'GET /registro-diario/:paciente_id/periodo/:data_inicio/:data_fim',
                    totais_dia: 'GET /registro-diario/:paciente_id/:data/totais',
                    resumo_diario: 'GET /resumo-diario/:paciente_id/:data? (PRINCIPAL PARA APP)',
                    deletar: 'DELETE /registro-diario/:registro_id/:paciente_id',
                    buscar_filtros: 'POST /registro-diario/buscar',
                    estatisticas: 'GET /registro-diario/:paciente_id/estatisticas/:dias?'
                },
                ia_processamento: {
                    audio_completo: {
                        url: 'POST /ia/processar-audio-refeicao',
                        descricao: 'Upload de áudio → Transcrição → Extração → Cálculo → Registro automático',
                        body: 'FormData: audio (arquivo) + paciente_id + nutri_id + tipo_refeicao + observacoes',
                        resultado: 'Registro em registro_diario + resumo diário atualizado'
                    },
                    transcrever: {
                        url: 'POST /ia/transcrever-audio',
                        descricao: 'Apenas transcrever áudio para texto',
                        body: 'FormData com "audio" (arquivo)'
                    },
                    extrair: {
                        url: 'POST /ia/extrair-alimento',
                        descricao: 'Extrair nome e quantidade de texto',
                        body: '{ "texto": "comi 200g de arroz" }'
                    },
                    calcular: {
                        url: 'POST /ia/calcular-macros',
                        descricao: 'Calcular macros e registrar no banco',
                        body: '{ "nome_alimento": "arroz", "quantidade": 200, "paciente_id": 1, "nutri_id": 1, "tipo_refeicao": "almoco", "observacoes": "..." }'
                    },
                    similares: 'GET /ia/alimentos-similares?nome=<nome>'
                }            },
            recursos: {
                banco_hibrido: 'MySQL AWS (persistência) + SQLite in-memory (alimentos TACO)',
                busca_ia: 'Rota /alimento/search-ia otimizada para processamento de linguagem natural',
                performance: 'Consultas de alimentos extremamente rápidas',
                fluxo_sistema: 'Nutri define METAS → Paciente registra CONSUMO via IA → App calcula DIFERENÇA'
            },
            estrutura_dados: {
                dieta: 'Metas diárias definidas pela nutricionista (proteína, carbo, gordura, calorias)',
                registro_diario: 'Consumo real registrado via IA ou manual (com origem e confiança)',
                resumo_diario: 'Comparação automática: META vs CONSUMO = RESTANTE'
            }
        }
    });
});

// Rota de teste do banco
app.get('/test-db', async (req, res) => {
    try {
        const knex = require('./database/connection');
        const tables = ['nutri', 'paciente', 'alimento', 'dieta'];
        const status = {};

        for (const table of tables) {
            try {
                await knex(table).first();
                status[table] = 'OK';
            } catch (error) {
                status[table] = `Erro: ${error.message}`;
            }
        }

        res.json({ 
            dbStatus: 'Conectado',
            tables: status
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao conectar ao banco',
            details: error.message
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});


app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.use(routes);

const PORT = process.env.PORT || 3333; 

// Inicializar servidor e banco in-memory
async function startServer() {
    try {
        // Inicializar banco in-memory primeiro
        await initializeInMemoryDB();
        
        // Depois iniciar o servidor
        app.listen(PORT, '127.0.0.1', () => { 
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Banco de alimentos SQLite in-memory carregado!`);
        });
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        process.exit(1);
    }
}

// Iniciar aplicação
startServer();

process.on('unhandledRejection', (error) => {
    console.error('unhandledRejection:', error);
});
