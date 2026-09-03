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
    buscarImovelParaEdicao,
    atualizarImovel
} = require("../controllers/imoveisEdicao.controller");

const {
    adicionarFotos,
    removerFoto
} = require("../controllers/imoveisFotos.controller");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const upload = require("../middlewares/upload.middleware");
const { fotoLimiter } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.get("/", listarImoveis);
router.get("/meus", autenticarUsuario, listarMeusImoveis);
router.get("/fotos/:fotoId", fotoLimiter, exibirFoto);
router.get("/:id/edicao", autenticarUsuario, buscarImovelParaEdicao);
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

router.post(
    "/:id/fotos",
    autenticarUsuario,
    upload.array("fotos", 10),
    adicionarFotos
);

router.put("/:id", autenticarUsuario, express.json(), atualizarImovel);
router.delete("/:id/fotos/:fotoId", autenticarUsuario, removerFoto);
router.delete("/:id", autenticarUsuario, excluirImovel);

module.exports = router;
