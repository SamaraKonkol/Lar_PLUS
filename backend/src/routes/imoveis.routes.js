const express = require("express");

const {
    criarImovel,
    exibirFoto,
    listarImoveis,
    listarMeusImoveis,
    buscarImovelPorId,
    excluirImovel
} = require("../controllers/imoveisController");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", listarImoveis);
router.get("/meus", autenticarUsuario, listarMeusImoveis);
router.get("/fotos/:fotoId", exibirFoto);
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

router.delete("/:id", autenticarUsuario, excluirImovel);

module.exports = router;