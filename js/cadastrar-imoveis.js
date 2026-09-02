const formularioImovel = document.querySelector(".formulario-imovel");
const botaoPublicar = document.querySelector(".botao-publicar");
const campoDescricao = document.getElementById("descricao");
const contadorDescricao = campoDescricao?.closest(".campo")?.querySelector(".rodape-campo span");
const campoValor = document.getElementById("valor-aluguel");
const resumoValores = document.querySelectorAll(".resumo-valores strong");
const inputFotos = document.querySelector('[name="fotos-imovel"]');
const areaUpload = document.querySelector(".area-upload");
const limiteFotos = 10;
const tamanhoMaximoFoto = 10 * 1024 * 1024;
let fotosSelecionadas = [];
const etapasProgresso = Array.from(document.querySelectorAll(".etapa-progresso"));
const linhasProgresso = Array.from(document.querySelectorAll(".linha-progresso"));

function carregarEstilosAjustes() {
    [
        "css/cadastrar-imovel-ajustes.css?v=20260902-2",
        "css/avisos.css?v=20260902-2"
    ].forEach(href => {
        const caminho = href.split("?")[0];

        if (document.querySelector(`link[href^="${caminho}"]`)) {
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    });
}

function mostrarAvisoGlass(titulo, mensagem, tipo = "sucesso") {
    document.querySelector(".aviso-glass")?.remove();

    const aviso = document.createElement("div");
    aviso.className = `aviso-glass aviso-${tipo}`;

    const icone = document.createElement("span");
    icone.className = "aviso-glass-icone";
    icone.textContent = tipo === "sucesso" ? "✓" : "!";

    const conteudo = document.createElement("div");

    const tituloElemento = document.createElement("strong");
    tituloElemento.textContent = titulo;

    const texto = document.createElement("p");
    texto.textContent = mensagem;

    conteudo.append(tituloElemento, texto);
    aviso.append(icone, conteudo);
    document.body.appendChild(aviso);

    requestAnimationFrame(() => aviso.classList.add("visivel"));

    return aviso;
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

    fotosSelecionadas.forEach(foto => {
        formData.append("fotos", foto);
    });

    adicionarArquivo(formData, '[name="matricula"]', "matricula");
    adicionarArquivo(formData, '[name="comprovante-propriedade"]', "comprovante_propriedade");
    adicionarArquivo(formData, '[name="iptu-documento"]', "iptu_documento");

    return formData;
}

function chaveArquivo(arquivo) {
    return `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`;
}

function adicionarFotosSelecionadas() {
    if (!inputFotos) {
        return;
    }

    const novasFotos = Array.from(inputFotos.files || []);
    const chavesSelecionadas = new Set(fotosSelecionadas.map(chaveArquivo));
    let formatoInvalido = false;
    let tamanhoExcedido = false;
    let limiteAtingido = false;

    novasFotos.forEach(foto => {
        if (!foto.type.startsWith("image/")) {
            formatoInvalido = true;
            return;
        }

        if (foto.size > tamanhoMaximoFoto) {
            tamanhoExcedido = true;
            return;
        }

        const chave = chaveArquivo(foto);

        if (chavesSelecionadas.has(chave)) {
            return;
        }

        if (fotosSelecionadas.length >= limiteFotos) {
            limiteAtingido = true;
            return;
        }

        fotosSelecionadas.push(foto);
        chavesSelecionadas.add(chave);
    });

    inputFotos.value = "";
    renderizarPreviewFotos();

    const avisos = [];

    if (formatoInvalido) {
        avisos.push("Alguns arquivos não eram imagens e foram ignorados.");
    }

    if (tamanhoExcedido) {
        avisos.push("Cada foto pode ter no máximo 10 MB.");
    }

    if (limiteAtingido) {
        avisos.push("Você pode adicionar no máximo 10 fotos.");
    }

    if (avisos.length > 0) {
        mostrarAvisoGlass("Confira as fotos", avisos.join(" "), "erro");
    }
}

function removerFotoSelecionada(indice) {
    fotosSelecionadas.splice(indice, 1);
    renderizarPreviewFotos();
}

function renderizarPreviewFotos() {
    if (!inputFotos || !areaUpload) {
        return;
    }

    document.querySelector(".preview-fotos")?.remove();

    const titulo = areaUpload.querySelector("strong");
    const texto = areaUpload.querySelector("p");

    if (fotosSelecionadas.length === 0) {
        areaUpload.classList.remove("com-arquivos");

        if (titulo) {
            titulo.textContent = "Arraste suas fotos ou clique para selecionar";
        }

        if (texto) {
            texto.textContent = "PNG, JPG ou WEBP. Máximo de 10 MB por imagem.";
        }

        return;
    }

    areaUpload.classList.add("com-arquivos");

    if (titulo) {
        titulo.textContent = `${fotosSelecionadas.length}/${limiteFotos} ${fotosSelecionadas.length === 1 ? "foto selecionada" : "fotos selecionadas"}`;
    }

    if (texto) {
        texto.textContent = "Clique novamente para adicionar fotos de outra pasta.";
    }

    const preview = document.createElement("div");
    preview.className = "preview-fotos";

    fotosSelecionadas.forEach((arquivo, indice) => {
        const item = document.createElement("div");
        item.className = "preview-foto";

        const imagem = document.createElement("img");
        imagem.src = URL.createObjectURL(arquivo);
        imagem.alt = `Prévia de ${arquivo.name}`;
        imagem.addEventListener("load", () => URL.revokeObjectURL(imagem.src), { once: true });

        const nome = document.createElement("span");
        nome.textContent = arquivo.name;

        const botaoRemover = document.createElement("button");
        botaoRemover.type = "button";
        botaoRemover.className = "botao-remover-foto";
        botaoRemover.setAttribute("aria-label", `Remover ${arquivo.name}`);
        botaoRemover.textContent = "×";
        botaoRemover.addEventListener("click", () => removerFotoSelecionada(indice));

        item.append(imagem, nome, botaoRemover);
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

    const token = obterToken();

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
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || "Não foi possível publicar o imóvel.");
        }

        mostrarAvisoGlass(
            "Imóvel publicado!",
            "Seu anúncio foi salvo com sucesso. Voltando para o dashboard..."
        );

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1600);
    } catch (erro) {
        console.error("Erro ao publicar imóvel:", erro);
        mostrarAvisoGlass(
            "Não foi possível publicar",
            erro.message || "Tente novamente em alguns instantes.",
            "erro"
        );
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
inputFotos?.addEventListener("change", adicionarFotosSelecionadas);
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
