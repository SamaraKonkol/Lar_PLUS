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
    upload.fields([
        { name: "fotos", maxCount: 10 },
        { name: "matricula", maxCount: 1 },
        { name: "comprovante_propriedade", maxCount: 1 },
        { name: "iptu_documento", maxCount: 1 }
    ]),
    criarImovel
);

module.exports = router;