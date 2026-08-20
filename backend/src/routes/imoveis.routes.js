const express = require("express");

const {
    criarImovel
} = require("../controllers/imoveisController");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const router = express.Router();

// rota pública para testar/listar futuramente
router.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API de imóveis funcionando!"
    });
});

// só usuário logado pode publicar
router.post("/", autenticarUsuario, criarImovel);

module.exports = router;