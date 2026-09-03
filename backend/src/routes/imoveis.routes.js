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
    alterarStatusImovel
} = require("../controllers/imoveisStatus.controller");

const {
    autenticarUsuario
} = require("../middlewares/autenticacao.middleware");

const {
    validarIdImovel,
    validarIdFoto,
    validarDadosImovel,
    validarStatusImovel
} = require("../middlewares/imoveis.middleware");

const upload = require("../middlewares/upload.middleware");
const { fotoLimiter } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.get("/", listarImoveis);
router.get("/meus", autenticarUsuario, listarMeusImoveis);
router.get("/fotos/:fotoId", validarIdFoto, fotoLimiter, exibirFoto);
router.get("/:id/edicao", autenticarUsuario, validarIdImovel, buscarImovelParaEdicao);
router.get("/:id", validarIdImovel, buscarImovelPorId);

router.post(
    "/",
    autenticarUsuario,
    upload.fields([
        { name: "fotos", maxCount: 10 },
        { name: "matricula", maxCount: 1 },
        { name: "comprovante_propriedade", maxCount: 1 },
        { name: "iptu_documento", maxCount: 1 }
    ]),
    validarDadosImovel,
    criarImovel
);

router.post(
    "/:id/fotos",
    autenticarUsuario,
    validarIdImovel,
    upload.array("fotos", 10),
    adicionarFotos
);

router.put(
    "/:id",
    autenticarUsuario,
    validarIdImovel,
    express.json(),
    validarDadosImovel,
    atualizarImovel
);

router.patch(
    "/:id/status",
    autenticarUsuario,
    validarIdImovel,
    express.json(),
    validarStatusImovel,
    alterarStatusImovel
);

router.delete(
    "/:id/fotos/:fotoId",
    autenticarUsuario,
    validarIdImovel,
    validarIdFoto,
    removerFoto
);

router.delete("/:id", autenticarUsuario, validarIdImovel, excluirImovel);

module.exports = router;
