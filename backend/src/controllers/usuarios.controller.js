const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { db } = require("../database/database");
const { uploadImagemS3 } = require("../utils/uploadS3");
const { enviarEmailRecuperacao } = require("../config/email");

const {
    somenteNumeros,
    validarCPF,
    validarEmail,
    validarTelefone,
    validarSenha
} = require("../utils/validacoes");

const HASH_SENHA_INEXISTENTE = "$2b$12$d10mquafeLQs65b58.kqaOkV8qCM6eduBV78R7Hb8No8joIdreNLO";
const LIMITE_TENTATIVAS_LOGIN = 3;
const DURACAO_BLOQUEIO_MINUTOS = 15;

function obterIp(req) {
    return req.ip || req.socket.remoteAddress || "desconhecido";
}

async function buscarBloqueioLogin(email, ip) {
    const resultado = await db.query(`
        SELECT quantidade, bloqueado_ate
        FROM tentativas_login
        WHERE email = $1 AND ip = $2
    `, [email, ip]);

    const tentativa = resultado.rows[0];

    if (!tentativa?.bloqueado_ate) {
        return null;
    }

    if (new Date(tentativa.bloqueado_ate) <= new Date()) {
        await db.query(
            "DELETE FROM tentativas_login WHERE email = $1 AND ip = $2",
            [email, ip]
        );
        return null;
    }

    return tentativa;
}

async function registrarFalhaLogin(email, ip) {
    const resultado = await db.query(`
        INSERT INTO tentativas_login (email, ip, quantidade)
        VALUES ($1, $2, 1)
        ON CONFLICT (email, ip)
        DO UPDATE SET
            quantidade = tentativas_login.quantidade + 1,
            atualizado_em = NOW()
        RETURNING quantidade
    `, [email, ip]);

    const quantidade = resultado.rows[0].quantidade;

    if (quantidade >= LIMITE_TENTATIVAS_LOGIN) {
        await db.query(`
            UPDATE tentativas_login
            SET bloqueado_ate = NOW() + ($3 * INTERVAL '1 minute'), atualizado_em = NOW()
            WHERE email = $1 AND ip = $2
        `, [email, ip, DURACAO_BLOQUEIO_MINUTOS]);
    }

    return quantidade;
}

function responderLoginBloqueado(res) {
    return res.status(429).json({
        sucesso: false,
        mensagem: "Limite de tentativas atingido. Redefina sua senha para continuar.",
        recuperarSenha: true
    });
}

async function cadastrarUsuario(req, res) {
    try {
        const { nome, sobrenome, email, cpf, telefone, senha } = req.body;

        if (!nome || !sobrenome || !email || !cpf || !telefone || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }

        const nomeLimpo = nome.trim();
        const sobrenomeLimpo = sobrenome.trim();
        const emailNormalizado = email.trim().toLowerCase();
        const cpfNormalizado = somenteNumeros(cpf);
        const telefoneNormalizado = somenteNumeros(telefone);

        if (nomeLimpo.length < 2) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um nome válido." });
        }

        if (sobrenomeLimpo.length < 2) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um sobrenome válido." });
        }

        if (!validarEmail(emailNormalizado)) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um e-mail válido." });
        }

        if (!validarCPF(cpfNormalizado)) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um CPF válido." });
        }

        if (!validarTelefone(telefoneNormalizado)) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um telefone válido com DDD." });
        }

        const resultadoSenha = validarSenha(senha);

        if (!resultadoSenha.valida) {
            return res.status(400).json({ sucesso: false, mensagem: resultadoSenha.mensagem });
        }

        const emailExistente = await db.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [emailNormalizado]
        );

        if (emailExistente.rowCount > 0) {
            return res.status(409).json({ sucesso: false, mensagem: "Já existe uma conta com esse e-mail." });
        }

        const cpfExistente = await db.query(
            "SELECT id FROM usuarios WHERE cpf = $1",
            [cpfNormalizado]
        );

        if (cpfExistente.rowCount > 0) {
            return res.status(409).json({ sucesso: false, mensagem: "Já existe uma conta com esse CPF." });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const resultado = await db.query(`
            INSERT INTO usuarios (nome, sobrenome, email, cpf, telefone, senha_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nome, sobrenome, email, cpf, telefone, foto_url, criado_em
        `, [
            nomeLimpo,
            sobrenomeLimpo,
            emailNormalizado,
            cpfNormalizado,
            telefoneNormalizado,
            senhaHash
        ]);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Usuário cadastrado com sucesso!",
            usuario: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao cadastrar usuário:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao cadastrar usuário."
        });
    }
}

async function loginUsuario(req, res) {
    try {
        const { email, senha } = req.body;
        const manterConectado = req.body.manterConectado === true;

        if (!email || !senha) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe e-mail e senha." });
        }

        const emailNormalizado = email.trim().toLowerCase();
        const ip = obterIp(req);
        const bloqueio = await buscarBloqueioLogin(emailNormalizado, ip);

        if (bloqueio) {
            return responderLoginBloqueado(res);
        }

        const resultado = await db.query(`
            SELECT id, nome, sobrenome, email, senha_hash, foto_url
            FROM usuarios
            WHERE email = $1
        `, [emailNormalizado]);

        const usuario = resultado.rows[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario?.senha_hash || HASH_SENHA_INEXISTENTE
        );

        if (!usuario || !senhaCorreta) {
            const quantidade = await registrarFalhaLogin(emailNormalizado, ip);

            if (quantidade >= LIMITE_TENTATIVAS_LOGIN) {
                return responderLoginBloqueado(res);
            }

            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha inválidos.",
                tentativasRestantes: LIMITE_TENTATIVAS_LOGIN - quantidade
            });
        }

        await db.query(
            "DELETE FROM tentativas_login WHERE email = $1 AND ip = $2",
            [emailNormalizado, ip]
        );

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: manterConectado ? "30d" : "12h" }
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                email: usuario.email,
                foto_url: usuario.foto_url
            }
        });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar login."
        });
    }
}

async function solicitarRecuperacaoSenha(req, res) {
    const respostaGenerica = {
        sucesso: true,
        mensagem: "Se houver uma conta com esse e-mail, enviaremos um link de recuperação."
    };

    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!validarEmail(email)) {
            return res.status(200).json(respostaGenerica);
        }

        const resultado = await db.query(
            "SELECT id, nome, email FROM usuarios WHERE email = $1",
            [email]
        );
        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(200).json(respostaGenerica);
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await db.query(
            "UPDATE recuperacoes_senha SET usado_em = NOW() WHERE usuario_id = $1 AND usado_em IS NULL",
            [usuario.id]
        );

        await db.query(`
            INSERT INTO recuperacoes_senha (usuario_id, token_hash, expira_em)
            VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
        `, [usuario.id, tokenHash]);

        const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

        if (!frontendUrl) {
            throw new Error("FRONTEND_URL não configurada.");
        }

        const link = `${frontendUrl}/redefinir-senha.html?token=${token}`;
        await enviarEmailRecuperacao(usuario.email, usuario.nome, link);

        return res.status(200).json(respostaGenerica);
    } catch (erro) {
        console.error("Erro ao solicitar recuperação de senha:", erro);
        return res.status(200).json(respostaGenerica);
    }
}

async function redefinirSenha(req, res) {
    const { token, senha, confirmarSenha } = req.body;

    if (!token || !senha || !confirmarSenha) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha todos os campos." });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({ sucesso: false, mensagem: "As senhas não coincidem." });
    }

    const resultadoSenha = validarSenha(senha);

    if (!resultadoSenha.valida) {
        return res.status(400).json({ sucesso: false, mensagem: resultadoSenha.mensagem });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const cliente = await db.connect();

    try {
        await cliente.query("BEGIN");

        const resultado = await cliente.query(`
            SELECT r.id, r.usuario_id, u.email
            FROM recuperacoes_senha r
            JOIN usuarios u ON u.id = r.usuario_id
            WHERE r.token_hash = $1
              AND r.usado_em IS NULL
              AND r.expira_em > NOW()
            FOR UPDATE
        `, [tokenHash]);
        const recuperacao = resultado.rows[0];

        if (!recuperacao) {
            await cliente.query("ROLLBACK");
            return res.status(400).json({
                sucesso: false,
                mensagem: "Este link é inválido ou expirou. Solicite uma nova recuperação."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        await cliente.query(
            "UPDATE usuarios SET senha_hash = $1 WHERE id = $2",
            [senhaHash, recuperacao.usuario_id]
        );
        await cliente.query(
            "UPDATE recuperacoes_senha SET usado_em = NOW() WHERE id = $1",
            [recuperacao.id]
        );
        await cliente.query(
            "DELETE FROM tentativas_login WHERE email = $1",
            [recuperacao.email]
        );
        await cliente.query("COMMIT");

        return res.status(200).json({
            sucesso: true,
            mensagem: "Senha redefinida com sucesso. Você já pode entrar."
        });
    } catch (erro) {
        await cliente.query("ROLLBACK");
        console.error("Erro ao redefinir senha:", erro);
        return res.status(500).json({ sucesso: false, mensagem: "Não foi possível redefinir a senha." });
    } finally {
        cliente.release();
    }
}

async function buscarPerfil(req, res) {
    try {
        const resultado = await db.query(`
            SELECT id, nome, sobrenome, email, cpf, telefone, foto_url, criado_em
            FROM usuarios
            WHERE id = $1
        `, [req.usuario.id]);

        const usuario = resultado.rows[0];

        if (!usuario) {
            return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        }

        return res.status(200).json({ sucesso: true, usuario });
    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar perfil."
        });
    }
}

async function editarPerfil(req, res) {
    try {
        const { nome, sobrenome, email, telefone } = req.body;

        if (!nome || !sobrenome || !email || !telefone) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }

        const nomeLimpo = nome.trim();
        const sobrenomeLimpo = sobrenome.trim();
        const emailNormalizado = email.trim().toLowerCase();
        const telefoneNormalizado = somenteNumeros(telefone);

        if (nomeLimpo.length < 2) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um nome válido." });
        }

        if (sobrenomeLimpo.length < 2) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um sobrenome válido." });
        }

        if (!validarEmail(emailNormalizado)) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe um e-mail válido." });
        }

        if (!validarTelefone(telefoneNormalizado)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe um telefone válido com DDD."
            });
        }

        const emailExistente = await db.query(
            "SELECT id FROM usuarios WHERE email = $1 AND id <> $2",
            [emailNormalizado, req.usuario.id]
        );

        if (emailExistente.rowCount > 0) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Já existe uma conta com esse e-mail."
            });
        }

        const perfilAtual = await db.query(
            "SELECT foto_url FROM usuarios WHERE id = $1",
            [req.usuario.id]
        );

        if (perfilAtual.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Usuário não encontrado."
            });
        }

        let fotoUrl = perfilAtual.rows[0].foto_url;

        if (req.file) {
            fotoUrl = await uploadImagemS3(req.file, "imoveis/perfis");
        }

        const resultado = await db.query(
            "UPDATE usuarios SET nome = $1, sobrenome = $2, email = $3, telefone = $4, foto_url = $5 " +
            "WHERE id = $6 RETURNING id, nome, sobrenome, email, cpf, telefone, foto_url, criado_em",
            [
                nomeLimpo,
                sobrenomeLimpo,
                emailNormalizado,
                telefoneNormalizado,
                fotoUrl,
                req.usuario.id
            ]
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: "Perfil atualizado com sucesso!",
            usuario: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao editar perfil:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao editar perfil."
        });
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario,
    solicitarRecuperacaoSenha,
    redefinirSenha,
    buscarPerfil,
    editarPerfil
};
