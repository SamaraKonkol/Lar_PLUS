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

            criado_em TEXT NOT NULL
                DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Tabela de usuários pronta!");
}

module.exports = {
    db,
    inicializarBanco
};