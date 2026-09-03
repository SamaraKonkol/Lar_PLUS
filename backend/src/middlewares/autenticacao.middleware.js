const jwt = require("jsonwebtoken");

function autenticarUsuario(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            erro: "Usuário não autenticado."
        });
    }

    const partes = authorization.trim().split(/\s+/);

    if (
        partes.length !== 2 ||
        partes[0] !== "Bearer" ||
        !partes[1]
    ) {
        return res.status(401).json({
            erro: "Token inválido."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET não configurado.");

        return res.status(500).json({
            erro: "Erro interno de autenticação."
        });
    }

    try {
        const dados = jwt.verify(partes[1], process.env.JWT_SECRET);
        const usuarioId = Number(dados.id);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(401).json({
                erro: "Token inválido."
            });
        }

        req.usuario = {
            id: usuarioId
        };

        next();
    } catch (erro) {
        return res.status(401).json({
            erro: "Token inválido ou expirado."
        });
    }
}

module.exports = {
    autenticarUsuario
};
