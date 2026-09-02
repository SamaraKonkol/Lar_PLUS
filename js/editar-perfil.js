const formularioPerfil = document.querySelector(".formulario-perfil");
const campoNome = document.getElementById("nome");
const campoSobrenome = document.getElementById("sobrenome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoCpf = document.getElementById("cpf");
const campoFoto = document.getElementById("foto-perfil");
const previewFoto = document.getElementById("foto-perfil-preview");
const nomeArquivoFoto = document.getElementById("nome-arquivo-foto");
const botaoAjustarRecorte = document.getElementById("botao-ajustar-recorte");
const botaoSalvar = document.querySelector(".botao-salvar");
const modalRecorte = document.getElementById("modal-recorte");
const botaoFecharModal = document.getElementById("fechar-modal-recorte");
const botaoCancelarRecorte = document.getElementById("cancelar-recorte");
const botaoConfirmarRecorte = document.getElementById("confirmar-recorte");
const canvasFoto = document.getElementById("foto-canvas");
const contextoFoto = canvasFoto?.getContext("2d");
const controleZoom = document.getElementById("zoom-foto");
const botaoCentralizarFoto = document.getElementById("botao-centralizar-foto");

let fotoPerfilAtualUrl = "img/avatar-padrao-azul.svg";
let imagemEdicao = null;
let urlImagemOriginal = null;
let fotoRecortada = null;
let urlPreviewRecortada = null;
let escalaBase = 1;
let nivelZoom = 1;
let deslocamentoX = 0;
let deslocamentoY = 0;
let arrastandoFoto = false;
let ultimoPontoX = 0;
let ultimoPontoY = 0;
let estadoConfirmado = null;

function somenteNumerosPerfil(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function formatarCpfPerfil(valor) {
    const numeros = somenteNumerosPerfil(valor).slice(0, 11);

    return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefonePerfil(valor) {
    const numeros = somenteNumerosPerfil(valor).slice(0, 11);

    if (numeros.length <= 10) {
        return numeros
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function aplicarFallbackImagem(imagem) {
    if (!imagem) {
        return;
    }

    imagem.addEventListener("error", () => {
        if (!imagem.src.endsWith("/img/avatar-padrao-azul.svg")) {
            imagem.src = "img/avatar-padrao-azul.svg";
        }
    });
}

function liberarUrl(url) {
    if (url) {
        URL.revokeObjectURL(url);
    }
}

function limitarDeslocamentoFoto() {
    if (!imagemEdicao || !canvasFoto) {
        return;
    }

    const escala = escalaBase * nivelZoom;
    const larguraDesenhada = imagemEdicao.naturalWidth * escala;
    const alturaDesenhada = imagemEdicao.naturalHeight * escala;
    const limiteX = Math.max(0, (larguraDesenhada - canvasFoto.width) / 2);
    const limiteY = Math.max(0, (alturaDesenhada - canvasFoto.height) / 2);

    deslocamentoX = Math.max(-limiteX, Math.min(limiteX, deslocamentoX));
    deslocamentoY = Math.max(-limiteY, Math.min(limiteY, deslocamentoY));
}

function desenharFotoEditada() {
    if (!imagemEdicao || !contextoFoto) {
        return;
    }

    limitarDeslocamentoFoto();

    const escala = escalaBase * nivelZoom;
    const larguraDesenhada = imagemEdicao.naturalWidth * escala;
    const alturaDesenhada = imagemEdicao.naturalHeight * escala;
    const posicaoX = (canvasFoto.width - larguraDesenhada) / 2 + deslocamentoX;
    const posicaoY = (canvasFoto.height - alturaDesenhada) / 2 + deslocamentoY;

    contextoFoto.fillStyle = "#dce9ef";
    contextoFoto.fillRect(0, 0, canvasFoto.width, canvasFoto.height);
    contextoFoto.drawImage(
        imagemEdicao,
        posicaoX,
        posicaoY,
        larguraDesenhada,
        alturaDesenhada
    );
}

function abrirModalRecorte() {
    if (!imagemEdicao) {
        return;
    }

    estadoConfirmado = {
        nivelZoom,
        deslocamentoX,
        deslocamentoY
    };

    modalRecorte.hidden = false;
    document.body.classList.add("modal-aberto");
    requestAnimationFrame(desenharFotoEditada);
}

function fecharModalRecorte() {
    modalRecorte.hidden = true;
    document.body.classList.remove("modal-aberto");
}

function centralizarFoto() {
    nivelZoom = 1;
    deslocamentoX = 0;
    deslocamentoY = 0;
    controleZoom.value = "1";
    desenharFotoEditada();
}

function descartarNovoRecorte() {
    if (fotoRecortada && estadoConfirmado) {
        nivelZoom = estadoConfirmado.nivelZoom;
        deslocamentoX = estadoConfirmado.deslocamentoX;
        deslocamentoY = estadoConfirmado.deslocamentoY;
        controleZoom.value = String(nivelZoom);
        desenharFotoEditada();
    } else if (!fotoRecortada) {
        liberarUrl(urlImagemOriginal);
        urlImagemOriginal = null;
        imagemEdicao = null;
        campoFoto.value = "";
    }

    fecharModalRecorte();
}

function carregarImagemParaRecorte(arquivo) {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.addEventListener("load", () => {
        liberarUrl(urlImagemOriginal);
        liberarUrl(urlPreviewRecortada);

        urlImagemOriginal = url;
        urlPreviewRecortada = null;
        fotoRecortada = null;
        imagemEdicao = imagem;
        botaoAjustarRecorte.hidden = true;
        previewFoto.src = fotoPerfilAtualUrl;
        nomeArquivoFoto.textContent = arquivo.name;
        escalaBase = Math.max(
            canvasFoto.width / imagem.naturalWidth,
            canvasFoto.height / imagem.naturalHeight
        );
        centralizarFoto();
        abrirModalRecorte();
    }, { once: true });

    imagem.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        campoFoto.value = "";
        mostrarAvisoInterface(
            "Não foi possível abrir a foto",
            "Escolha outra imagem e tente novamente.",
            "erro"
        );
    }, { once: true });

    imagem.src = url;
}

function gerarFotoRecortada() {
    return new Promise((resolve, reject) => {
        canvasFoto.toBlob(blob => {
            if (!blob) {
                reject(new Error("Não foi possível gerar o recorte da foto."));
                return;
            }

            resolve(blob);
        }, "image/jpeg", 0.9);
    });
}

async function confirmarRecorte() {
    try {
        botaoConfirmarRecorte.disabled = true;
        botaoConfirmarRecorte.textContent = "Preparando...";

        const blob = await gerarFotoRecortada();

        liberarUrl(urlPreviewRecortada);
        fotoRecortada = blob;
        urlPreviewRecortada = URL.createObjectURL(blob);
        previewFoto.src = urlPreviewRecortada;
        botaoAjustarRecorte.hidden = false;
        nomeArquivoFoto.textContent = "Recorte pronto para salvar";
        estadoConfirmado = {
            nivelZoom,
            deslocamentoX,
            deslocamentoY
        };
        fecharModalRecorte();
    } catch (erro) {
        mostrarAvisoInterface("Não foi possível recortar", erro.message, "erro");
    } finally {
        botaoConfirmarRecorte.disabled = false;
        botaoConfirmarRecorte.textContent = "Usar este recorte";
    }
}

function limparEdicaoFoto() {
    liberarUrl(urlImagemOriginal);
    liberarUrl(urlPreviewRecortada);
    urlImagemOriginal = null;
    urlPreviewRecortada = null;
    fotoRecortada = null;
    imagemEdicao = null;
    estadoConfirmado = null;
    campoFoto.value = "";
    botaoAjustarRecorte.hidden = true;
    nomeArquivoFoto.textContent = "Nenhuma nova foto selecionada";
}

function preencherFormulario(usuario) {
    campoNome.value = usuario.nome || "";
    campoSobrenome.value = usuario.sobrenome || "";
    campoEmail.value = usuario.email || "";
    campoTelefone.value = formatarTelefonePerfil(usuario.telefone);
    campoCpf.value = formatarCpfPerfil(usuario.cpf);
    fotoPerfilAtualUrl = usuario.foto_url || "img/avatar-padrao-azul.svg";

    if (!fotoRecortada) {
        previewFoto.src = fotoPerfilAtualUrl;
    }

    const fotoHeader = document.querySelector(".foto-perfil-header");
    const nomeHeader = document.querySelector(".nome-usuario-header");

    aplicarFallbackImagem(fotoHeader);

    if (fotoHeader) {
        fotoHeader.src = fotoPerfilAtualUrl;
    }

    if (nomeHeader) {
        nomeHeader.textContent = usuario.nome || "Perfil";
    }
}

aplicarFallbackImagem(previewFoto);

campoTelefone?.addEventListener("input", () => {
    campoTelefone.value = formatarTelefonePerfil(campoTelefone.value);
});

campoFoto?.addEventListener("change", () => {
    const arquivo = campoFoto.files?.[0];

    if (!arquivo) {
        return;
    }

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!formatosPermitidos.includes(arquivo.type)) {
        campoFoto.value = "";
        mostrarAvisoInterface("Foto inválida", "Escolha uma imagem JPG, PNG ou WEBP.", "erro");
        return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
        campoFoto.value = "";
        mostrarAvisoInterface("Foto muito grande", "A imagem pode ter no máximo 10 MB.", "erro");
        return;
    }

    carregarImagemParaRecorte(arquivo);
});

controleZoom?.addEventListener("input", () => {
    nivelZoom = Number(controleZoom.value);
    desenharFotoEditada();
});

botaoCentralizarFoto?.addEventListener("click", centralizarFoto);
botaoAjustarRecorte?.addEventListener("click", abrirModalRecorte);
botaoConfirmarRecorte?.addEventListener("click", confirmarRecorte);
botaoCancelarRecorte?.addEventListener("click", descartarNovoRecorte);
botaoFecharModal?.addEventListener("click", descartarNovoRecorte);

canvasFoto?.addEventListener("pointerdown", event => {
    if (!imagemEdicao) {
        return;
    }

    arrastandoFoto = true;
    ultimoPontoX = event.clientX;
    ultimoPontoY = event.clientY;
    canvasFoto.setPointerCapture(event.pointerId);
});

canvasFoto?.addEventListener("pointermove", event => {
    if (!arrastandoFoto || !imagemEdicao) {
        return;
    }

    const proporcao = canvasFoto.width / canvasFoto.getBoundingClientRect().width;
    deslocamentoX += (event.clientX - ultimoPontoX) * proporcao;
    deslocamentoY += (event.clientY - ultimoPontoY) * proporcao;
    ultimoPontoX = event.clientX;
    ultimoPontoY = event.clientY;
    desenharFotoEditada();
});

function finalizarArrasteFoto(event) {
    if (!arrastandoFoto) {
        return;
    }

    arrastandoFoto = false;

    if (canvasFoto.hasPointerCapture(event.pointerId)) {
        canvasFoto.releasePointerCapture(event.pointerId);
    }
}

canvasFoto?.addEventListener("pointerup", finalizarArrasteFoto);
canvasFoto?.addEventListener("pointercancel", finalizarArrasteFoto);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modalRecorte.hidden) {
        descartarNovoRecorte();
    }
});

formularioPerfil?.addEventListener("submit", async event => {
    event.preventDefault();

    const token = obterToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const textoOriginal = botaoSalvar.textContent;
    const formData = new FormData();

    formData.append("nome", campoNome.value.trim());
    formData.append("sobrenome", campoSobrenome.value.trim());
    formData.append("email", campoEmail.value.trim());
    formData.append("telefone", somenteNumerosPerfil(campoTelefone.value));

    if (fotoRecortada) {
        formData.append("foto", fotoRecortada, "foto-perfil.jpg");
    }

    try {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        const resposta = await fetch(API_URL + "/api/usuarios/perfil", {
            method: "PATCH",
            headers: {
                Authorization: "Bearer " + token
            },
            body: formData
        });

        const dados = await lerRespostaApi(resposta);

        if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível atualizar o perfil.");
        }

        limparEdicaoFoto();
        preencherFormulario(dados.usuario);
        mostrarAvisoInterface("Perfil atualizado!", dados.mensagem);
    } catch (erro) {
        mostrarAvisoInterface(
            "Não foi possível salvar",
            erro.message || "Tente novamente em alguns instantes.",
            "erro"
        );
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = textoOriginal;
    }
});

window.addEventListener("beforeunload", () => {
    liberarUrl(urlImagemOriginal);
    liberarUrl(urlPreviewRecortada);
});

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina();

    if (usuario) {
        preencherFormulario(usuario);
    }
});
