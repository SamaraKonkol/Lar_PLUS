const express = require("express");

const {
    cadastrarUsuario,
    loginUsuario
} = require("../controllers/usuarios.controller");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API de usuários funcionando!"
    });
});

router.post("/", cadastrarUsuario);

router.post("/login", loginUsuario);

module.exports = router;