import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

import db, { dbPath } from './config/database.js';
import frotaRepository from './repositories/frotaRepository.js';
import frotaController from './controllers/frotaController.js';
import frotaRoutes from './routes/frotaRoutes.js';

// ============================================================
// CONFIGURAÇÃO DOS CAMINHOS
// ============================================================

// Descobre o caminho completo deste arquivo
const __filename = fileURLToPath(import.meta.url);

// Descobre a pasta onde este arquivo está
const __dirname = path.dirname(__filename);

// Caminho da pasta dist criada pelo Vite depois do npm run build
const frontendPath = path.resolve(__dirname, '../dist');

// ============================================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================================

const app = express();

// Porta principal do servidor Node.js
const port = Number(process.env.PORT || 3000);

// ============================================================
// MIDDLEWARES
// ============================================================

// Permite comunicação entre frontend e backend
app.use(cors());

// Permite receber JSON nas requisições
app.use(express.json({ limit: '1mb' }));

// ============================================================
// API - HEALTH
// ============================================================

// Verifica se a API está funcionando
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'NOC API',
        timestamp: new Date().toISOString(),
        database: dbPath
    });
});

// ============================================================
// API - DADOS GERAIS DO NOC
// ============================================================

app.get('/api/dados', async (req, res) => {
    try {
        const [
            infraestrutura,
            noc,
            frota,
            frotaTotal,
            frotaPorCategoria
        ] = await Promise.all([

            // Busca os links de infraestrutura
            new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM infraestrutura WHERE id > 0 ORDER BY id',
                    [],
                    (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    }
                );
            }),

            // Busca as coordenadas do NOC
            new Promise((resolve, reject) => {
                db.get(
                    'SELECT latitude, longitude FROM infraestrutura WHERE id = 0',
                    [],
                    (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row || {});
                        }
                    }
                );
            }),

            // Retorna no máximo 500 veículos
            frotaRepository.listarTodos(500),

            // Conta quantos veículos existem no banco
            frotaRepository.contar(),

            // Conta veículos por categoria
            frotaRepository.contarPorCategoria()
        ]);

        res.json({
            infraestrutura,
            frota,
            frotaTotal,
            frotaPorCategoria,
            noc
        });

    } catch (error) {
        console.error('GET /api/dados:', error);

        res.status(500).json({
            error: 'Falha ao carregar dados do NOC.'
        });
    }
});

// ============================================================
// API - INFRAESTRUTURA
// ============================================================

app.get('/api/infraestrutura', (req, res) => {
    db.all(
        'SELECT * FROM infraestrutura WHERE id > 0 ORDER BY id',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ============================================================
// API - FROTA / CRUD
// ============================================================

// Todas as rotas:
//
// GET
// GET por ID
// POST
// PUT
// DELETE

app.use('/api/frota', frotaRoutes);

// ============================================================
// API - EVENTOS
// ============================================================

// Busca os últimos 20 eventos
app.get('/api/eventos', (req, res) => {
    db.all(
        `
        SELECT 
            id,
            severidade,
            mensagem,
            origem,
            criado_em
        FROM eventos
        ORDER BY id DESC
        LIMIT 20
        `,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ============================================================
// API - CRIAR EVENTO
// ============================================================

app.post('/api/eventos', (req, res) => {

    const {
        severidade = 'info',
        mensagem,
        origem = 'API'
    } = req.body || {};

    // Severidades permitidas
    const permitidos = new Set([
        'info',
        'warning',
        'critical'
    ]);

    // Verifica mensagem
    if (!mensagem) {
        return res.status(400).json({
            error: 'mensagem é obrigatória'
        });
    }

    // Verifica severidade
    if (!permitidos.has(severidade)) {
        return res.status(400).json({
            error: 'severidade inválida'
        });
    }

    // Salva o evento no SQLite
    db.run(
        `
        INSERT INTO eventos (
            severidade,
            mensagem,
            origem
        )
        VALUES (?, ?, ?)
        `,
        [
            severidade,
            mensagem,
            origem
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                id: this.lastID,
                message: 'Evento registrado.'
            });
        }
    );
});

// ============================================================
// COMPATIBILIDADE COM A TELEMETRIA ANTIGA
// ============================================================

// Mantém o endpoint antigo funcionando
app.put(
    '/api/telemetria/:id',
    frotaController.atualizarTelemetria.bind(frotaController)
);

// ============================================================
// SERVIR O FRONTEND REACT
// ============================================================

// Depois de executar:
//
// npm run build
//
// o Vite cria a pasta:
//
// dist/
//
// O Express passa a servir essa pasta.

// Disponibiliza CSS, JavaScript, imagens etc.
app.use(express.static(frontendPath));

// ============================================================
// FALLBACK DO REACT
// ============================================================

// Se a requisição NÃO for para /api,
// entregamos o index.html do React.
//
// Isso permite acessar diretamente:
//
// http://localhost:3000
// http://localhost:3000/dashboard
// http://localhost:3000/links
// http://localhost:3000/banco-dados
// http://localhost:3000/frota/Ônibus
//
// O React Router assume o controle depois.

app.use((req, res, next) => {

    // Se for uma rota da API que não existe,
    // não mandamos o index.html.
    if (req.path.startsWith('/api')) {
        return next();
    }

    // Para qualquer outra rota,
    // entregamos o React.
    res.sendFile(
        path.join(frontendPath, 'index.html'),
        (err) => {
            if (err) {
                next(err);
            }
        }
    );
});

// ============================================================
// ROTA 404 PARA API
// ============================================================

app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'Rota da API não encontrada.',
        path: req.originalUrl
    });
});

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================

app.use((err, req, res, next) => {

    console.error('Erro não tratado:', err);

    res.status(500).json({
        error: 'Erro interno do servidor.'
    });
});

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================

const server = app.listen(
    port,
    () => {

        console.log('');
        console.log('==========================================');
        console.log('🚀 NOC COMMAND CENTER');
        console.log('==========================================');
        console.log(`🌐 Sistema: http://localhost:${port}`);
        console.log(`🔌 API: http://localhost:${port}/api`);
        console.log(`❤️ Health: http://localhost:${port}/api/health`);
        console.log('==========================================');
        console.log('');
    }
);

// ============================================================
// ENCERRAMENTO SEGURO
// ============================================================

function shutdown(signal) {

    console.log(`\n${signal} recebido. Encerrando API...`);

    // Primeiro fecha o servidor HTTP
    server.close(() => {

        // Depois fecha o banco SQLite
        db.close(() => {

            console.log('✅ Servidor encerrado com segurança.');

            process.exit(0);
        });
    });
}

// Ctrl + C
process.on(
    'SIGINT',
    () => shutdown('SIGINT')
);

// Encerramento do processo
process.on(
    'SIGTERM',
    () => shutdown('SIGTERM')
);