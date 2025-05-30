const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class AlimentoInMemoryService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                // Criar banco SQLite in-memory
                this.db = new sqlite3.Database(':memory:', (err) => {
                    if (err) {
                        console.error('Erro ao criar banco in-memory:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Banco SQLite in-memory criado!');
                });

                // Criar tabela de alimentos
                this.db.run(`
                    CREATE TABLE alimentos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        codigo TEXT,
                        nome TEXT NOT NULL,
                        calorias REAL,
                        proteinas REAL,
                        carboidratos REAL,
                        gordura REAL,
                        fibra REAL,
                        calcio REAL,
                        ferro REAL,
                        sodio REAL,
                        categoria TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Tabela alimentos criada no banco in-memory!');
                    
                    // Tentar carregar dados do CSV
                    this.loadCSVData()
                        .then(() => {
                            this.isInitialized = true;
                            resolve();
                        })
                        .catch(reject);
                });

            } catch (error) {
                console.error('Erro na inicialização:', error);
                reject(error);
            }
        });
    }

    async loadCSVData() {
        return new Promise((resolve, reject) => {
            const csvPath = path.join(__dirname, '..', '..', 'data', 'taco.csv');
            
            // Verificar se o arquivo CSV existe
            if (!fs.existsSync(csvPath)) {
                console.log('⚠️  Arquivo CSV não encontrado em:', csvPath);
                console.log('📝 Por favor, coloque o arquivo taco.csv na pasta /data/');
                // Criar alguns dados de exemplo para teste
                this.createSampleData();
                resolve();
                return;
            }

            const alimentos = [];
            
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Adaptar conforme as colunas do seu CSV TACO
                    // Exemplo de mapeamento - ajuste conforme necessário
                    const alimento = {
                        codigo: row.codigo || row.Codigo || '',
                        nome: row.nome || row.Nome || row.alimento || row.Alimento || '',
                        calorias: parseFloat(row.calorias || row.Energia || row.energia || 0),
                        proteinas: parseFloat(row.proteinas || row.Proteina || row.proteina || 0),
                        carboidratos: parseFloat(row.carboidratos || row.Carboidrato || row.carboidrato || 0),
                        gordura: parseFloat(row.gordura || row.Lipidio || row.lipidio || 0),
                        fibra: parseFloat(row.fibra || row.Fibra || 0),
                        calcio: parseFloat(row.calcio || row.Calcio || 0),
                        ferro: parseFloat(row.ferro || row.Ferro || 0),
                        sodio: parseFloat(row.sodio || row.Sodio || 0),
                        categoria: row.categoria || row.Categoria || 'Outros'
                    };
                    
                    if (alimento.nome) {
                        alimentos.push(alimento);
                    }
                })
                .on('end', () => {
                    console.log(`📊 Carregando ${alimentos.length} alimentos do CSV...`);
                    this.insertAlimentos(alimentos)
                        .then(() => {
                            console.log('✅ Alimentos carregados com sucesso!');
                            resolve();
                        })
                        .catch(reject);
                })
                .on('error', (error) => {
                    console.error('Erro ao ler CSV:', error);
                    reject(error);
                });
        });
    }

    async insertAlimentos(alimentos) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO alimentos (codigo, nome, calorias, proteinas, carboidratos, gordura, fibra, calcio, ferro, sodio, categoria)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                alimentos.forEach((alimento) => {
                    stmt.run([
                        alimento.codigo,
                        alimento.nome,
                        alimento.calorias,
                        alimento.proteinas,
                        alimento.carboidratos,
                        alimento.gordura,
                        alimento.fibra,
                        alimento.calcio,
                        alimento.ferro,
                        alimento.sodio,
                        alimento.categoria
                    ]);
                });

                this.db.run('COMMIT', (err) => {
                    stmt.finalize();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    createSampleData() {
        console.log('📝 Criando dados de exemplo...');
        const sampleAlimentos = [
            { codigo: '001', nome: 'Arroz branco', calorias: 130, proteinas: 2.7, carboidratos: 28.0, gordura: 0.3, fibra: 1.3, calcio: 10, ferro: 0.8, sodio: 5, categoria: 'Cereais' },
            { codigo: '002', nome: 'Feijão preto', calorias: 132, proteinas: 8.9, carboidratos: 23.0, gordura: 0.5, fibra: 8.4, calcio: 29, ferro: 1.5, sodio: 2, categoria: 'Leguminosas' },
            { codigo: '003', nome: 'Frango grelhado', calorias: 195, proteinas: 29.8, carboidratos: 0.0, gordura: 7.4, fibra: 0, calcio: 15, ferro: 1.0, sodio: 70, categoria: 'Carnes' },
            { codigo: '004', nome: 'Banana', calorias: 89, proteinas: 1.1, carboidratos: 23.0, gordura: 0.3, fibra: 2.6, calcio: 5, ferro: 0.3, sodio: 1, categoria: 'Frutas' },
            { codigo: '005', nome: 'Batata doce', calorias: 86, proteinas: 1.6, carboidratos: 20.1, gordura: 0.1, fibra: 3.0, calcio: 30, ferro: 0.6, sodio: 4, categoria: 'Tubérculos' }
        ];

        this.insertAlimentos(sampleAlimentos)
            .then(() => console.log('✅ Dados de exemplo criados!'))
            .catch(err => console.error('Erro ao criar dados de exemplo:', err));
    }

    async searchAlimentos(query, limit = 10) {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('Banco in-memory não inicializado'));
                return;
            }

            const sql = `
                SELECT * FROM alimentos 
                WHERE nome LIKE ? OR categoria LIKE ?
                ORDER BY 
                    CASE 
                        WHEN nome LIKE ? THEN 1
                        WHEN nome LIKE ? THEN 2
                        ELSE 3
                    END,
                    nome
                LIMIT ?
            `;

            const searchTerm = `%${query}%`;
            const exactStart = `${query}%`;

            this.db.all(sql, [searchTerm, searchTerm, exactStart, searchTerm, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAlimentoById(id) {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('Banco in-memory não inicializado'));
                return;
            }

            this.db.get('SELECT * FROM alimentos WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getAllAlimentos(limit = 100) {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('Banco in-memory não inicializado'));
                return;
            }

            this.db.all('SELECT * FROM alimentos ORDER BY nome LIMIT ?', [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAlimentoCount() {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('Banco in-memory não inicializado'));
                return;
            }

            this.db.get('SELECT COUNT(*) as count FROM alimentos', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }
}

// Singleton para garantir uma única instância
const alimentoService = new AlimentoInMemoryService();

module.exports = alimentoService;
