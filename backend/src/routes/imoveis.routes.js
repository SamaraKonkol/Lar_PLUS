const express = require("express");

const {
    criarImovel,
    listarImoveis,
    buscarImovelPorId
} = require("../controllers/imoveisController");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", listarImoveis);

router.get("/:id", buscarImovelPorId);

router.post(
    "/",
    autenticarUsuario,
    upload.array("fotos", 10),
    criarImovel
);


module.exports = router;