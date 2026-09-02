const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function inicializarBanco() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada.");
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            sobrenome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cpf TEXT NOT NULL UNIQUE,
            telefone TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            foto_url TEXT,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS imoveis (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT NOT NULL,
            finalidade TEXT NOT NULL DEFAULT 'aluguel',
            valor NUMERIC(12,2) NOT NULL,
            cep TEXT,
            estado TEXT,
            cidade TEXT NOT NULL,
            bairro TEXT NOT NULL,
            endereco TEXT NOT NULL,
            numero TEXT,
            complemento TEXT,
            ocultar_numero BOOLEAN NOT NULL DEFAULT FALSE,
            quartos INTEGER DEFAULT 0,
            suites INTEGER DEFAULT 0,
            banheiros INTEGER DEFAULT 0,
            vagas INTEGER DEFAULT 0,
            area NUMERIC(12,2),
            area_construida NUMERIC(12,2),
            status TEXT NOT NULL DEFAULT 'disponivel',
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS imoveis_valores (
            id SERIAL PRIMARY KEY,
            imovel_id INTEGER NOT NULL UNIQUE REFERENCES imoveis(id) ON DELETE CASCADE,
            condominio NUMERIC(12,2) NOT NULL DEFAULT 0,
            iptu NUMERIC(12,2) NOT NULL DEFAULT 0,
            seguro NUMERIC(12,2) NOT NULL DEFAULT 0,
            financiamento NUMERIC(12,2) NOT NULL DEFAULT 0,
            reserva_percentual INTEGER NOT NULL DEFAULT 10,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS imoveis_regras (
            id SERIAL PRIMARY KEY,
            imovel_id INTEGER NOT NULL UNIQUE REFERENCES imoveis(id) ON DELETE CASCADE,
            disponibilidade TEXT,
            contrato_minimo INTEGER NOT NULL DEFAULT 12,
            regras_adicionais TEXT,
            aceita_animais BOOLEAN NOT NULL DEFAULT TRUE,
            aceita_criancas BOOLEAN NOT NULL DEFAULT TRUE,
            permite_fumar BOOLEAN NOT NULL DEFAULT FALSE,
            entrada_imediata BOOLEAN NOT NULL DEFAULT FALSE,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS imoveis_comodidades (
            id SERIAL PRIMARY KEY,
            imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (imovel_id, nome)
        );

        CREATE TABLE IF NOT EXISTS imoveis_fotos (
            id SERIAL PRIMARY KEY,
            imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
            foto_url TEXT NOT NULL,
            ordem INTEGER NOT NULL DEFAULT 1,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS imoveis_documentos (
            id SERIAL PRIMARY KEY,
            imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
            tipo TEXT NOT NULL,
            arquivo_url TEXT NOT NULL,
            nome_original TEXT,
            status TEXT NOT NULL DEFAULT 'pendente',
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS favoritos (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (usuario_id, imovel_id)
        );

        CREATE TABLE IF NOT EXISTS tentativas_login (
            email TEXT NOT NULL,
            ip TEXT NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 0,
            bloqueado_ate TIMESTAMPTZ,
            atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (email, ip)
        );

        CREATE TABLE IF NOT EXISTS recuperacoes_senha (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expira_em TIMESTAMPTZ NOT NULL,
            usado_em TIMESTAMPTZ,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_recuperacoes_senha_usuario
        ON recuperacoes_senha (usuario_id);

        CREATE INDEX IF NOT EXISTS idx_recuperacoes_senha_expiracao
        ON recuperacoes_senha (expira_em);
    `);

    console.log("PostgreSQL pronto!");
}

module.exports = {
    db: pool,
    inicializarBanco
};
