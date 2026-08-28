const express = require("express");

const {
    cadastrarUsuario,
    loginUsuario,
    buscarPerfil,
    editarPerfil
} = require("../controllers/usuarios.controller");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        sucesso: true,
        mensagem: "API de usuários funcionando!"
    });
});

router.post(
    "/",
    cadastrarUsuario
);


router.post(
    "/login",
    loginUsuario
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