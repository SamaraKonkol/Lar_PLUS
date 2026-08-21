const express = require("express");

const {
    adicionarFavorito,
    removerFavorito,
    listarFavoritos
} = require("../controllers/favoritos.controller");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const router = express.Router();

router.use(autenticarUsuario);

router.get(
    "/",
    listarFavoritos
);

router.post(
    "/:imovel_id",
    adicionarFavorito
);

router.delete(
    "/:imovel_id",
    removerFavorito
);


module.exports = router;