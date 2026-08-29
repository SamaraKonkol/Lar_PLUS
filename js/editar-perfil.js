const formularioPerfil = document.querySelector(".formulario-perfil");
const campoNome = document.getElementById("nome");
const campoSobrenome = document.getElementById("sobrenome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoCpf = document.getElementById("cpf");
const campoFoto = document.getElementById("foto-perfil");
const previewFoto = document.getElementById("foto-perfil-preview");
const canvasFoto = document.getElementById("foto-canvas");
const contextoFoto = canvasFoto?.getContext("2d");
const controlesFoto = document.getElementById("controles-foto");
const controleZoom = document.getElementById("zoom-foto");
const botaoCentralizarFoto = document.getElementById("botao-centralizar-foto");
const nomeArquivoFoto = document.getElementById("nome-arquivo-foto");
const botaoSalvar = document.querySelector(".botao-salvar");

let arquivoFotoSelecionado = null;
let imagemEdicao = null;
let urlImagemEdicao = null;
let escalaBase = 1;
let nivelZoom = 1;
let deslocamentoX = 0;
let deslocamentoY = 0;
let arrastandoFoto = false;
let ultimoPontoX = 0;
let ultimoPontoY = 0;

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

function liberarUrlImagemEdicao() {
    if (urlImagemEdicao) {
        URL.revokeObjectURL(urlImagemEdicao);
        urlImagemEdicao = null;
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
    if (!imagemEdicao || !canvasFoto || !contextoFoto) {
        return;
    }

    limitarDeslocamentoFoto();

    const escala = escalaBase * nivelZoom;
    const larguraDesenhada = imagemEdicao.naturalWidth * escala;
    const alturaDesenhada = imagemEdicao.naturalHeight * escala;
    const posicaoX = (canvasFoto.width - larguraDesenhada) / 2 + deslocamentoX;
    const posicaoY = (canvasFoto.height - alturaDesenhada) / 2 + deslocamentoY;

    contextoFoto.clearRect(0, 0, canvasFoto.width, canvasFoto.height);
    contextoFoto.fillStyle = "#f0edff";
    contextoFoto.fillRect(0, 0, canvasFoto.width, canvasFoto.height);
    contextoFoto.drawImage(
        imagemEdicao,
        posicaoX,
        posicaoY,
        larguraDesenhada,
        alturaDesenhada
    );
}

function centralizarFoto() {
    nivelZoom = 1;
    deslocamentoX = 0;
    deslocamentoY = 0;

    if (controleZoom) {
        controleZoom.value = "1";
    }

    desenharFotoEditada();
}

function abrirEditorFoto(arquivo) {
    const novaUrl = URL.createObjectURL(arquivo);
    const novaImagem = new Image();

    novaImagem.addEventListener("load", () => {
        liberarUrlImagemEdicao();

        urlImagemEdicao = novaUrl;
        imagemEdicao = novaImagem;
        arquivoFotoSelecionado = arquivo;
        escalaBase = Math.max(
            canvasFoto.width / novaImagem.naturalWidth,
            canvasFoto.height / novaImagem.naturalHeight
        );

        previewFoto.hidden = true;
        canvasFoto.hidden = false;
        controlesFoto.hidden = false;
        nomeArquivoFoto.textContent = arquivo.name;
        centralizarFoto();
    }, { once: true });

    novaImagem.addEventListener("error", () => {
        URL.revokeObjectURL(novaUrl);
        mostrarAvisoInterface(
            "Não foi possível abrir a foto",
            "Escolha outra imagem e tente novamente.",
            "erro"
        );
    }, { once: true });

    novaImagem.src = novaUrl;
}

function encerrarEditorFoto(fotoUrl) {
    liberarUrlImagemEdicao();
    arquivoFotoSelecionado = null;
    imagemEdicao = null;
    campoFoto.value = "";
    canvasFoto.hidden = true;
    controlesFoto.hidden = true;
    previewFoto.hidden = false;
    previewFoto.src = fotoUrl || "img/avatar-padrao.svg";
    nomeArquivoFoto.textContent = "Nenhuma nova foto selecionada";
}

function gerarFotoRecortada() {
    return new Promise((resolve, reject) => {
        if (!imagemEdicao || !canvasFoto) {
            resolve(null);
            return;
        }

        canvasFoto.toBlob(blob => {
            if (!blob) {
                reject(new Error("Não foi possível preparar a foto para envio."));
                return;
            }

            resolve(blob);
        }, "image/jpeg", 0.9);
    });
}

function preencherFormulario(usuario) {
    campoNome.value = usuario.nome || "";
    campoSobrenome.value = usuario.sobrenome || "";
    campoEmail.value = usuario.email || "";
    campoTelefone.value = formatarTelefonePerfil(usuario.telefone);
    campoCpf.value = formatarCpfPerfil(usuario.cpf);

    if (!imagemEdicao) {
        previewFoto.src = usuario.foto_url || "img/avatar-padrao.svg";
    }

    const fotoHeader = document.querySelector(".foto-perfil-header");
    const nomeHeader = document.querySelector(".nome-usuario-header");

    if (fotoHeader) {
        fotoHeader.src = usuario.foto_url || "img/avatar-padrao.svg";
    }

    if (nomeHeader) {
        nomeHeader.textContent = usuario.nome || "Perfil";
    }
}

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

    abrirEditorFoto(arquivo);
});

controleZoom?.addEventListener("input", () => {
    nivelZoom = Number(controleZoom.value);
    desenharFotoEditada();
});

botaoCentralizarFoto?.addEventListener("click", centralizarFoto);

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

    try {
        if (arquivoFotoSelecionado) {
            const fotoRecortada = await gerarFotoRecortada();
            formData.append("foto", fotoRecortada, "foto-perfil.jpg");
        }

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

        encerrarEditorFoto(dados.usuario.foto_url);
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

window.addEventListener("beforeunload", liberarUrlImagemEdicao);

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina();

    if (usuario) {
        preencherFormulario(usuario);
    }
});
