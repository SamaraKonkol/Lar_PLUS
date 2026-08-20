const Database = require("better-sqlite3");
const path = require("path");

const caminhoBanco = path.join(
    __dirname,
    "../../data/larplus.db"
);

const db = new Database(caminhoBanco);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

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

            criado_em TEXT NOT NULL
                DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const colunasUsuarios = db
        .prepare("PRAGMA table_info(usuarios)")
        .all();

    const possuiFotoUrl = colunasUsuarios.some(
        coluna => coluna.name === "foto_url"
    );

    if (!possuiFotoUrl) {
        db.exec(`
            ALTER TABLE usuarios
            ADD COLUMN foto_url TEXT;
        `);

        console.log("Coluna foto_url adicionada!");
    }

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

        cidade TEXT NOT NULL,
        bairro TEXT NOT NULL,
        endereco TEXT NOT NULL,
        numero TEXT,
        complemento TEXT,

        quartos INTEGER DEFAULT 0,
        banheiros INTEGER DEFAULT 0,
        vagas INTEGER DEFAULT 0,

        area REAL,

        status TEXT NOT NULL DEFAULT 'disponivel',

        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE
    );
`);

    console.log("Tabela de imóveis pronta!");

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