const express = require("express");

const {
    cadastrarUsuario,
    loginUsuario,
    solicitarRecuperacaoSenha,
    redefinirSenha,
    buscarPerfil,
    editarPerfil
} = require("../controllers/usuarios.controller");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const upload = require("../middlewares/upload.middleware");

const {
    loginLimiter,
    cadastroLimiter,
    recuperacaoLimiter,
    redefinicaoLimiter
} = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API de usuários funcionando!"
    });
});

router.post(
    "/",
    cadastroLimiter,
    cadastrarUsuario
);


router.post(
    "/login",
    loginLimiter,
    loginUsuario
);

router.post(
    "/senha/solicitar",
    recuperacaoLimiter,
    solicitarRecuperacaoSenha
);

router.post(
    "/senha/redefinir",
    redefinicaoLimiter,
    redefinirSenha
);


router.get(
    "/perfil",
    autenticarUsuario,
    buscarPerfil
);


router.patch(
    "/perfil",
    autenticarUsuario,
    upload.single("foto"),
    editarPerfil
);


module.exports = router;
