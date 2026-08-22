const Database = require("better-sqlite3");
const path = require("path");

const caminhoBanco = path.join(
    __dirname,
    "../../data/larplus.db"
);

const db = new Database(caminhoBanco);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function adicionarColunaSeNaoExistir(tabela, coluna, definicao) {
    const colunas = db
        .prepare(`PRAGMA table_info(${tabela})`)
        .all();

    const existe = colunas.some(
        item => item.name === coluna
    );

    if (!existe) {
        db.exec(`
            ALTER TABLE ${tabela}
            ADD COLUMN ${coluna} ${definicao};
        `);
    }
}

function inicializarBanco() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sobrenome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cpf TEXT NOT NULL UNIQUE,
            telefone TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            foto_url TEXT,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    adicionarColunaSeNaoExistir(
        "usuarios",
        "foto_url",
        "TEXT"
    );

    console.log("Tabela de usuários pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT NOT NULL,
            finalidade TEXT NOT NULL DEFAULT 'aluguel',
            valor REAL NOT NULL,
            cep TEXT,
            estado TEXT,
            cidade TEXT NOT NULL,
            bairro TEXT NOT NULL,
            endereco TEXT NOT NULL,
            numero TEXT,
            complemento TEXT,
            ocultar_numero INTEGER NOT NULL DEFAULT 0,
            quartos INTEGER DEFAULT 0,
            suites INTEGER DEFAULT 0,
            banheiros INTEGER DEFAULT 0,
            vagas INTEGER DEFAULT 0,
            area REAL,
            area_construida REAL,
            status TEXT NOT NULL DEFAULT 'disponivel',
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        );
    `);

    adicionarColunaSeNaoExistir("imoveis", "cep", "TEXT");
    adicionarColunaSeNaoExistir("imoveis", "estado", "TEXT");
    adicionarColunaSeNaoExistir("imoveis", "ocultar_numero", "INTEGER NOT NULL DEFAULT 0");
    adicionarColunaSeNaoExistir("imoveis", "suites", "INTEGER DEFAULT 0");
    adicionarColunaSeNaoExistir("imoveis", "area_construida", "REAL");

    console.log("Tabela de imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis_valores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imovel_id INTEGER NOT NULL UNIQUE,
            condominio REAL NOT NULL DEFAULT 0,
            iptu REAL NOT NULL DEFAULT 0,
            seguro REAL NOT NULL DEFAULT 0,
            financiamento REAL NOT NULL DEFAULT 0,
            reserva_percentual INTEGER NOT NULL DEFAULT 10,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE
        );
    `);

    console.log("Tabela de valores dos imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis_regras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imovel_id INTEGER NOT NULL UNIQUE,
            disponibilidade TEXT,
            contrato_minimo INTEGER NOT NULL DEFAULT 12,
            regras_adicionais TEXT,
            aceita_animais INTEGER NOT NULL DEFAULT 1,
            aceita_criancas INTEGER NOT NULL DEFAULT 1,
            permite_fumar INTEGER NOT NULL DEFAULT 0,
            entrada_imediata INTEGER NOT NULL DEFAULT 0,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE
        );
    `);

    console.log("Tabela de regras dos imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis_comodidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imovel_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE,
            UNIQUE (imovel_id, nome)
        );
    `);

    console.log("Tabela de comodidades dos imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis_fotos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imovel_id INTEGER NOT NULL,
            foto_url TEXT NOT NULL,
            ordem INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE
        );
    `);

    console.log("Tabela de fotos dos imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS imoveis_documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imovel_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            arquivo_url TEXT NOT NULL,
            nome_original TEXT,
            status TEXT NOT NULL DEFAULT 'pendente',
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE
        );
    `);

    console.log("Tabela de documentos dos imóveis pronta!");

    db.exec(`
        CREATE TABLE IF NOT EXISTS favoritos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            imovel_id INTEGER NOT NULL,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE,
            FOREIGN KEY (imovel_id)
                REFERENCES imoveis(id)
                ON DELETE CASCADE,
            UNIQUE (usuario_id, imovel_id)
        );
    `);

    console.log("Tabela de favoritos pronta!");
}

module.exports = {
    db,
    inicializarBanco
};