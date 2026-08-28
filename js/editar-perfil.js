const formularioPerfil = document.querySelector(".formulario-perfil");
const campoNome = document.getElementById("nome");
const campoSobrenome = document.getElementById("sobrenome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoCpf = document.getElementById("cpf");
const campoFoto = document.getElementById("foto-perfil");
const previewFoto = document.getElementById("foto-perfil-preview");
const nomeArquivoFoto = document.getElementById("nome-arquivo-foto");
const botaoSalvar = document.querySelector(".botao-salvar");
let urlPreviewFoto = null;

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

function liberarPreviewTemporario() {
    if (urlPreviewFoto) {
        URL.revokeObjectURL(urlPreviewFoto);
        urlPreviewFoto = null;
    }
}

function preencherFormulario(usuario) {
    campoNome.value = usuario.nome || "";
    campoSobrenome.value = usuario.sobrenome || "";
    campoEmail.value = usuario.email || "";
    campoTelefone.value = formatarTelefonePerfil(usuario.telefone);
    campoCpf.value = formatarCpfPerfil(usuario.cpf);
    previewFoto.src = usuario.foto_url || "img/avatar-padrao.svg";

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

    liberarPreviewTemporario();
    urlPreviewFoto = URL.createObjectURL(arquivo);
    previewFoto.src = urlPreviewFoto;
    nomeArquivoFoto.textContent = arquivo.name;
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

    if (campoFoto.files?.[0]) {
        formData.append("foto", campoFoto.files[0]);
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

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível atualizar o perfil.");
        }

        liberarPreviewTemporario();
        campoFoto.value = "";
        nomeArquivoFoto.textContent = "Nenhuma nova foto selecionada";
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

window.addEventListener("beforeunload", liberarPreviewTemporario);

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina();

    if (usuario) {
        preencherFormulario(usuario);
    }
});
