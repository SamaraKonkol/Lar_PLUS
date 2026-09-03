const TIPOS_IMOVEL = new Set([
    "casa",
    "apartamento",
    "kitnet",
    "comercial",
    "terreno",
    "sitio"
]);

const FINALIDADES = new Set(["aluguel", "venda"]);
const STATUS_PERMITIDOS = new Set(["disponivel", "inativo"]);

function inteiroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0;
}

function numeroNaoNegativo(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return true;
    }

    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0;
}

function inteiroNaoNegativo(valor) {
    if (valor === undefined || valor === null || valor === "") {
        return true;
    }

    const numero = Number(valor);
    return Number.isInteger(numero) && numero >= 0;
}

function textoValido(valor, minimo, maximo) {
    if (typeof valor !== "string") {
        return false;
    }

    const texto = valor.trim();
    return texto.length >= minimo && texto.length <= maximo;
}

function responderErro(res, mensagem) {
    return res.status(400).json({
        sucesso: false,
        erro: mensagem
    });
}

function validarIdImovel(req, res, next) {
    if (!inteiroPositivo(req.params.id)) {
        return responderErro(res, "Identificador de imóvel inválido.");
    }

    next();
}

function validarIdFoto(req, res, next) {
    if (!inteiroPositivo(req.params.fotoId)) {
        return responderErro(res, "Identificador de foto inválido.");
    }

    next();
}

function validarDadosImovel(req, res, next) {
    const dados = req.body || {};

    if (!textoValido(dados.titulo, 3, 120)) {
        return responderErro(res, "O título deve ter entre 3 e 120 caracteres.");
    }

    if (!textoValido(dados.descricao, 10, 1500)) {
        return responderErro(res, "A descrição deve ter entre 10 e 1500 caracteres.");
    }

    if (!TIPOS_IMOVEL.has(dados.tipo)) {
        return responderErro(res, "Tipo de imóvel inválido.");
    }

    if (dados.finalidade && !FINALIDADES.has(dados.finalidade)) {
        return responderErro(res, "Finalidade do imóvel inválida.");
    }

    const valor = Number(dados.valor);

    if (!Number.isFinite(valor) || valor <= 0 || valor > 1000000000) {
        return responderErro(res, "Valor do imóvel inválido.");
    }

    if (!textoValido(dados.cidade, 2, 100)) {
        return responderErro(res, "Cidade inválida.");
    }

    if (!textoValido(dados.bairro, 2, 100)) {
        return responderErro(res, "Bairro inválido.");
    }

    if (!textoValido(dados.endereco, 2, 180)) {
        return responderErro(res, "Endereço inválido.");
    }

    if (dados.estado && !/^[A-Za-z]{2}$/.test(String(dados.estado).trim())) {
        return responderErro(res, "Estado inválido.");
    }

    const inteiros = [
        ["quartos", dados.quartos],
        ["suites", dados.suites],
        ["banheiros", dados.banheiros],
        ["vagas", dados.vagas],
        ["contrato mínimo", dados.contrato_minimo]
    ];

    for (const [nome, valorInteiro] of inteiros) {
        if (!inteiroNaoNegativo(valorInteiro)) {
            return responderErro(res, `${nome} deve ser um número inteiro não negativo.`);
        }
    }

    const numericos = [
        ["área", dados.area],
        ["área construída", dados.area_construida],
        ["condomínio", dados.condominio],
        ["IPTU", dados.iptu],
        ["seguro", dados.seguro],
        ["financiamento", dados.financiamento]
    ];

    for (const [nome, valorNumerico] of numericos) {
        if (!numeroNaoNegativo(valorNumerico)) {
            return responderErro(res, `${nome} deve ser um número não negativo.`);
        }
    }

    if (dados.reserva_percentual !== undefined && dados.reserva_percentual !== "") {
        const reserva = Number(dados.reserva_percentual);

        if (!Number.isFinite(reserva) || reserva < 0 || reserva > 100) {
            return responderErro(res, "O percentual de reserva deve estar entre 0 e 100.");
        }
    }

    next();
}

function validarStatusImovel(req, res, next) {
    if (!STATUS_PERMITIDOS.has(req.body?.status)) {
        return responderErro(res, "Status inválido.");
    }

    next();
}

module.exports = {
    validarIdImovel,
    validarIdFoto,
    validarDadosImovel,
    validarStatusImovel
};
