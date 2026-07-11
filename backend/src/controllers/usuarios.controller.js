const bcrypt = require("bcryptjs");

const {
    db
} = require("../database/database");

const {
    somenteNumeros,
    validarCPF,
    validarEmail,
    validarTelefone,
    validarSenha
} = require("../utils/validacoes");

async function cadastrarUsuario(req, res) {
    try {
        const {
            nome,
            sobrenome,
            email,
            cpf,
            telefone,
            senha
        } = req.body;

        if (
            !nome ||
            !sobrenome ||
            !email ||
            !cpf ||
            !telefone ||
            !senha
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Preencha todos os campos obrigatórios."
            });
        }

        const nomeLimpo = nome.trim();
        const sobrenomeLimpo = sobrenome.trim();
        const emailNormalizado =
            email.trim().toLowerCase();

        const cpfNormalizado =
            somenteNumeros(cpf);

        const telefoneNormalizado =
            somenteNumeros(telefone);

        if (nomeLimpo.length < 2) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um nome válido."
            });
        }

        if (sobrenomeLimpo.length < 2) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um sobrenome válido."
            });
        }

        if (!validarEmail(emailNormalizado)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um e-mail válido."
            });
        }

        if (!validarCPF(cpfNormalizado)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um CPF válido."
            });
        }

        if (!validarTelefone(telefoneNormalizado)) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Informe um telefone válido com DDD."
            });
        }

        const resultadoSenha =
            validarSenha(senha);

        if (!resultadoSenha.valida) {
            return res.status(400).json({
                sucesso: false,
                mensagem:
                    resultadoSenha.mensagem
            });
        }

        const usuarioComEmail = db.prepare(`
            SELECT id
            FROM usuarios
            WHERE email = ?
        `).get(emailNormalizado);

        if (usuarioComEmail) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe uma conta com esse e-mail."
            });
        }

        const usuarioComCpf = db.prepare(`
            SELECT id
            FROM usuarios
            WHERE cpf = ?
        `).get(cpfNormalizado);

        if (usuarioComCpf) {
            return res.status(409).json({
                sucesso: false,
                mensagem:
                    "Já existe uma conta com esse CPF."
            });
        }

        const senhaHash = await bcrypt.hash(
            senha,
            12
        );

        const resultado = db.prepare(`
            INSERT INTO usuarios (
                nome,
                sobrenome,
                email,
                cpf,
                telefone,
                senha_hash
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            nomeLimpo,
            sobrenomeLimpo,
            emailNormalizado,
            cpfNormalizado,
            telefoneNormalizado,
            senhaHash
        );

        const usuarioCriado = db.prepare(`
            SELECT
                id,
                nome,
                sobrenome,
                email,
                cpf,
                telefone,
                criado_em
            FROM usuarios
            WHERE id = ?
        `).get(resultado.lastInsertRowid);

        return res.status(201).json({
            sucesso: true,
            mensagem:
                "Usuário cadastrado com sucesso!",
            usuario: usuarioCriado
        });
    } catch (erro) {
        console.error(
            "Erro ao cadastrar usuário:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno ao cadastrar usuário."
        });
    }
}

module.exports = {
    cadastrarUsuario
};