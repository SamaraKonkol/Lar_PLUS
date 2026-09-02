const { rateLimit } = require("express-rate-limit");

function criarRespostaLimite(mensagem) {
    return {
        sucesso: false,
        mensagem
    };
}

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: req => /^\/imoveis\/fotos\//.test(req.path),
    message: criarRespostaLimite(
        "Muitas requisições foram realizadas. Aguarde alguns minutos e tente novamente."
    )
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: criarRespostaLimite(
        "Muitas solicitações de login. Aguarde 15 minutos e tente novamente."
    )
});

const fotoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: criarRespostaLimite(
        "Muitas imagens foram solicitadas. Aguarde alguns minutos e tente novamente."
    )
});

const recuperacaoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: criarRespostaLimite(
        "Muitas solicitações de recuperação. Aguarde uma hora e tente novamente."
    )
});

const redefinicaoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: criarRespostaLimite(
        "Muitas tentativas de redefinição. Aguarde uma hora e tente novamente."
    )
});

const cadastroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: criarRespostaLimite(
        "Muitas tentativas de cadastro. Aguarde uma hora e tente novamente."
    )
});

module.exports = {
    apiLimiter,
    loginLimiter,
    cadastroLimiter,
    fotoLimiter,
    recuperacaoLimiter,
    redefinicaoLimiter
};
