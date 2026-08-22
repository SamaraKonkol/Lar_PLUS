const formularioImovel = document.querySelector(".formulario-imovel");
const botaoPublicar = document.querySelector(".botao-publicar");
const campoDescricao = document.getElementById("descricao");
const contadorDescricao = campoDescricao?.closest(".campo")?.querySelector(".rodape-campo span");
const campoValor = document.getElementById("valor-aluguel");
const resumoValores = document.querySelectorAll(".resumo-valores strong");
const inputFotos = document.querySelector('[name="fotos-imovel"]');
const areaUpload = document.querySelector(".area-upload");
const etapasProgresso = Array.from(document.querySelectorAll(".etapa-progresso"));
const linhasProgresso = Array.from(document.querySelectorAll(".linha-progresso"));

function carregarEstilosAjustes() {
    if (document.querySelector('link[href="css/cadastrar-imovel-ajustes.css"]')) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/cadastrar-imovel-ajustes.css";
    document.head.appendChild(link);
}

function valorCampo(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function marcado(nome) {
    return document.querySelector(`[name="${nome}"]`)?.checked ? "1" : "0";
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function atualizarResumoValores() {
    if (!campoValor || resumoValores.length < 3) {
        return;
    }

    const valor = Number(campoValor.value || 0);
    const taxa = valor * 0.05;

    resumoValores[0].textContent = formatarMoeda(valor);
    resumoValores[1].textContent = formatarMoeda(taxa);
    resumoValores[2].textContent = formatarMoeda(valor + taxa);
}

function atualizarContadorDescricao() {
    if (!campoDescricao || !contadorDescricao) {
        return;
    }

    if (!campoDescricao.maxLength || campoDescricao.maxLength < 0) {
        campoDescricao.maxLength = 1500;
    }

    contadorDescricao.textContent = `${campoDescricao.value.length}/1500`;
}

function obterComodidades() {
    return Array.from(
        document.querySelectorAll(".lista-comodidades input[type='checkbox']:checked")
    ).map(input => input.name);
}

function adicionarArquivo(formData, seletor, nomeCampo) {
    const input = document.querySelector(seletor);

    if (input?.files?.[0]) {
        formData.append(nomeCampo, input.files[0]);
    }
}

function montarFormData() {
    const formData = new FormData();

    formData.append("titulo", valorCampo("titulo"));
    formData.append("descricao", valorCampo("descricao"));
    formData.append("tipo", valorCampo("tipo-imovel"));
    formData.append("finalidade", valorCampo("finalidade"));
    formData.append("valor", valorCampo("valor-aluguel"));
    formData.append("cep", valorCampo("cep"));
    formData.append("estado", valorCampo("estado"));
    formData.append("cidade", valorCampo("cidade"));
    formData.append("bairro", valorCampo("bairro"));
    formData.append("endereco", valorCampo("rua"));
    formData.append("numero", valorCampo("numero"));
    formData.append("complemento", valorCampo("complemento"));
    formData.append("ocultar_numero", marcado("ocultar-numero"));
    formData.append("quartos", valorCampo("quartos") || "0");
    formData.append("suites", valorCampo("suites") || "0");
    formData.append("banheiros", valorCampo("banheiros") || "0");
    formData.append("vagas", valorCampo("vagas") || "0");
    formData.append("area", valorCampo("area-total"));
    formData.append("area_construida", valorCampo("area-construida"));
    formData.append("condominio", valorCampo("condominio") || "0");
    formData.append("iptu", valorCampo("iptu") || "0");
    formData.append("seguro", valorCampo("seguro") || "0");
    formData.append("financiamento", valorCampo("financiamento") || "0");
    formData.append("reserva_percentual", valorCampo("reserva") || "10");
    formData.append("disponibilidade", valorCampo("disponibilidade"));
    formData.append("contrato_minimo", valorCampo("contrato-minimo") || "12");
    formData.append("regras_adicionais", valorCampo("regras"));
    formData.append("aceita_animais", marcado("aceita-animais"));
    formData.append("aceita_criancas", marcado("aceita-criancas"));
    formData.append("permite_fumar", marcado("permite-fumar"));
    formData.append("entrada_imediata", marcado("entrada-imediata"));
    formData.append("comodidades", JSON.stringify(obterComodidades()));

    const fotos = inputFotos?.files || [];

    Array.from(fotos).slice(0, 10).forEach(foto => {
        formData.append("fotos", foto);
    });

    adicionarArquivo(formData, '[name="matricula"]', "matricula");
    adicionarArquivo(formData, '[name="comprovante-propriedade"]', "comprovante_propriedade");
    adicionarArquivo(formData, '[name="iptu-documento"]', "iptu_documento");

    return formData;
}

function renderizarPreviewFotos() {
    if (!inputFotos || !areaUpload) {
        return;
    }

    document.querySelector(".preview-fotos")?.remove();

    const arquivos = Array.from(inputFotos.files || []).slice(0, 10);

    if (arquivos.length === 0) {
        areaUpload.classList.remove("com-arquivos");
        return;
    }

    areaUpload.classList.add("com-arquivos");

    const titulo = areaUpload.querySelector("strong");
    const texto = areaUpload.querySelector("p");

    if (titulo) {
        titulo.textContent = `${arquivos.length} ${arquivos.length === 1 ? "foto selecionada" : "fotos selecionadas"}`;
    }

    if (texto) {
        texto.textContent = "Clique novamente para trocar ou adicionar outras imagens.";
    }

    const preview = document.createElement("div");
    preview.className = "preview-fotos";

    arquivos.forEach(arquivo => {
        const item = document.createElement("div");
        item.className = "preview-foto";

        const imagem = document.createElement("img");
        imagem.src = URL.createObjectURL(arquivo);
        imagem.alt = arquivo.name;
        imagem.addEventListener("load", () => URL.revokeObjectURL(imagem.src), { once: true });

        const nome = document.createElement("span");
        nome.textContent = arquivo.name;

        item.appendChild(imagem);
        item.appendChild(nome);
        preview.appendChild(item);
    });

    areaUpload.insertAdjacentElement("afterend", preview);
}

function atualizarProgresso() {
    if (etapasProgresso.length === 0) {
        return;
    }

    const secoes = Array.from(document.querySelectorAll(".formulario-imovel .card-formulario"));

    if (secoes.length === 0) {
        return;
    }

    const pontoReferencia = window.scrollY + 240;
    let etapaAtual = 0;

    secoes.forEach((secao, indice) => {
        if (secao.offsetTop <= pontoReferencia) {
            etapaAtual = indice;
        }
    });

    const mapaEtapas = [0, 3, 5, 7];
    let etapaVisual = 0;

    mapaEtapas.forEach((indiceSecao, indiceEtapa) => {
        if (etapaAtual >= indiceSecao) {
            etapaVisual = indiceEtapa;
        }
    });

    etapasProgresso.forEach((etapa, indice) => {
        etapa.classList.toggle("ativa", indice === etapaVisual);
        etapa.classList.toggle("concluida", indice < etapaVisual);
    });

    linhasProgresso.forEach((linha, indice) => {
        linha.classList.toggle("concluida", indice < etapaVisual);
    });
}

async function publicarImovel(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (!formularioImovel.reportValidity()) {
        return;
    }

    const textoOriginal = botaoPublicar.textContent;

    try {
        botaoPublicar.disabled = true;
        botaoPublicar.textContent = "Publicando...";

        const resposta = await fetch(`${API_URL}/api/imoveis`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: montarFormData()
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || "Não foi possível publicar o imóvel.");
        }

        alert("Imóvel publicado com sucesso!");
        window.location.href = `detalhes.html?id=${dados.imovel_id}`;
    } catch (erro) {
        console.error("Erro ao publicar imóvel:", erro);
        alert(erro.message || "Erro ao publicar imóvel.");
    } finally {
        botaoPublicar.disabled = false;
        botaoPublicar.textContent = textoOriginal;
    }
}

async function iniciarCadastroImovel() {
    const usuario = await protegerPagina();

    if (!usuario) {
        return;
    }

    const nome = document.querySelector(".perfil-usuario strong");
    const subtitulo = document.querySelector(".perfil-usuario span");
    const avatar = document.querySelector(".avatar-usuario");

    if (nome) {
        nome.textContent = [usuario.nome, usuario.sobrenome].filter(Boolean).join(" ");
    }

    if (subtitulo) {
        subtitulo.textContent = "Minha conta";
    }

    if (avatar) {
        avatar.textContent = `${usuario.nome?.[0] || ""}${usuario.sobrenome?.[0] || ""}`.toUpperCase() || "?";
    }
}

campoValor?.addEventListener("input", atualizarResumoValores);
campoDescricao?.addEventListener("input", atualizarContadorDescricao);
inputFotos?.addEventListener("change", renderizarPreviewFotos);
formularioImovel?.addEventListener("submit", publicarImovel);
window.addEventListener("scroll", atualizarProgresso, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
    carregarEstilosAjustes();
    atualizarResumoValores();
    atualizarContadorDescricao();
    renderizarPreviewFotos();
    atualizarProgresso();
    iniciarCadastroImovel();
});