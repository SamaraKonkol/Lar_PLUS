const parametros = new URLSearchParams(window.location.search);
const imovelId = parametros.get("id");

const tipoImovel = document.getElementById("tipo-imovel");
const tituloImovel = document.getElementById("titulo-imovel");
const enderecoImovel = document.getElementById("endereco-imovel");
const imagemPrincipal = document.getElementById("imagem-principal");
const imagensSecundarias = document.getElementById("imagens-secundarias");
const quartosImovel = document.getElementById("quartos-imovel");
const banheirosImovel = document.getElementById("banheiros-imovel");
const vagasImovel = document.getElementById("vagas-imovel");
const areaImovel = document.getElementById("area-imovel");
const descricaoImovel = document.getElementById("descricao-imovel");
const localizacaoImovel = document.getElementById("localizacao-imovel");
const precoImovel = document.getElementById("preco-imovel");
const valorAluguel = document.getElementById("valor-aluguel");
const taxaLar = document.getElementById("taxa-lar");
const totalMensal = document.getElementById("total-mensal");
const avatarAnunciante = document.getElementById("avatar-anunciante");
const nomeAnunciante = document.getElementById("nome-anunciante");
const botaoFavoritar = document.getElementById("botao-favoritar");
const botaoAlugar = document.getElementById("botao-alugar");

let estaFavoritado = false;
let fotosAtuais = [];
let indiceFotoAtual = 0;

function carregarEstilosGaleria() {
    if (document.querySelector('link[href="css/galeria-fotos.css"]')) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/galeria-fotos.css";
    document.head.appendChild(link);
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarTipo(tipo) {
    if (!tipo) {
        return "";
    }

    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function criarIniciais(nome, sobrenome) {
    return `${nome?.charAt(0) || ""}${sobrenome?.charAt(0) || ""}`.toUpperCase();
}

function atualizarGaleriaModal() {
    const imagem = document.querySelector(".galeria-modal-imagem");
    const contador = document.querySelector(".galeria-modal-contador");

    if (!imagem || fotosAtuais.length === 0) {
        return;
    }

    imagem.src = fotosAtuais[indiceFotoAtual].foto_url;
    imagem.alt = `${tituloImovel.textContent} - foto ${indiceFotoAtual + 1}`;

    if (contador) {
        contador.textContent = `${indiceFotoAtual + 1} / ${fotosAtuais.length}`;
    }
}

function fecharGaleria() {
    const modal = document.querySelector(".galeria-modal");

    if (!modal) {
        return;
    }

    modal.classList.remove("aberta");
    document.body.classList.remove("galeria-aberta");

    setTimeout(() => modal.remove(), 220);
}

function abrirGaleria(indice = 0) {
    if (fotosAtuais.length === 0) {
        return;
    }

    document.querySelector(".galeria-modal")?.remove();
    indiceFotoAtual = Math.max(0, Math.min(indice, fotosAtuais.length - 1));

    const modal = document.createElement("div");
    modal.className = "galeria-modal";

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "galeria-modal-fechar";
    fechar.textContent = "×";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "galeria-modal-anterior";
    anterior.textContent = "‹";

    const proxima = document.createElement("button");
    proxima.type = "button";
    proxima.className = "galeria-modal-proxima";
    proxima.textContent = "›";

    const imagem = document.createElement("img");
    imagem.className = "galeria-modal-imagem";

    const contador = document.createElement("span");
    contador.className = "galeria-modal-contador";

    fechar.addEventListener("click", fecharGaleria);
    anterior.addEventListener("click", () => {
        indiceFotoAtual = (indiceFotoAtual - 1 + fotosAtuais.length) % fotosAtuais.length;
        atualizarGaleriaModal();
    });
    proxima.addEventListener("click", () => {
        indiceFotoAtual = (indiceFotoAtual + 1) % fotosAtuais.length;
        atualizarGaleriaModal();
    });
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            fecharGaleria();
        }
    });

    modal.append(fechar, anterior, imagem, proxima, contador);
    document.body.appendChild(modal);
    document.body.classList.add("galeria-aberta");

    requestAnimationFrame(() => modal.classList.add("aberta"));
    atualizarGaleriaModal();
}

function carregarGaleria(fotos, titulo) {
    fotosAtuais = Array.isArray(fotos) ? fotos : [];

    if (fotosAtuais.length === 0) {
        imagemPrincipal.src = "img/imovel-sem-foto.png";
        imagemPrincipal.alt = `Imóvel ${titulo}`;
        imagensSecundarias.innerHTML = "";
        return;
    }

    imagemPrincipal.src = fotosAtuais[0].foto_url;
    imagemPrincipal.alt = titulo;
    imagemPrincipal.style.cursor = "pointer";
    imagemPrincipal.onclick = () => abrirGaleria(0);
    imagemPrincipal.onerror = () => {
        imagemPrincipal.src = "img/imovel-sem-foto.png";
    };

    imagensSecundarias.innerHTML = "";

    fotosAtuais.slice(1, 5).forEach((foto, indice, lista) => {
        const indiceReal = indice + 1;

        if (indice === lista.length - 1 && fotosAtuais.length > 5) {
            const container = document.createElement("div");
            container.classList.add("ultima-imagem");

            const imagem = document.createElement("img");
            imagem.src = foto.foto_url;
            imagem.alt = titulo;

            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = `Ver todas as fotos (${fotosAtuais.length})`;
            botao.addEventListener("click", event => {
                event.stopPropagation();
                abrirGaleria(indiceReal);
            });

            container.addEventListener("click", () => abrirGaleria(indiceReal));
            container.appendChild(imagem);
            container.appendChild(botao);
            imagensSecundarias.appendChild(container);
            return;
        }

        const imagem = document.createElement("img");
        imagem.src = foto.foto_url;
        imagem.alt = titulo;
        imagem.style.cursor = "pointer";
        imagem.onerror = () => imagem.remove();
        imagem.addEventListener("click", () => abrirGaleria(indiceReal));
        imagensSecundarias.appendChild(imagem);
    });
}

function carregarMapa(imovel) {
    const container = document.querySelector(".mapa-falso");

    if (!container) {
        return;
    }

    const enderecoBusca = [
        imovel.endereco,
        imovel.numero,
        imovel.bairro,
        imovel.cidade,
        imovel.estado,
        imovel.cep,
        "Brasil"
    ].filter(Boolean).join(", ");

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(enderecoBusca)}&output=embed`;
    iframe.title = `Mapa de ${imovel.titulo}`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.style.width = "100%";
    iframe.style.height = "320px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "16px";
    iframe.style.display = "block";

    container.innerHTML = "";
    container.style.padding = "0";
    container.style.overflow = "hidden";
    container.style.minHeight = "320px";
    container.appendChild(iframe);
}

function preencherDados(imovel) {
    document.title = `${imovel.titulo} | Lar+`;
    tipoImovel.textContent = formatarTipo(imovel.tipo);
    tituloImovel.textContent = imovel.titulo;

    const enderecoCompleto = [
        imovel.endereco,
        imovel.ocultar_numero ? null : imovel.numero,
        imovel.bairro,
        imovel.cidade
    ].filter(Boolean).join(", ");

    enderecoImovel.textContent = enderecoCompleto;
    quartosImovel.textContent = imovel.quartos ?? 0;
    banheirosImovel.textContent = imovel.banheiros ?? 0;
    vagasImovel.textContent = imovel.vagas ?? 0;
    areaImovel.textContent = imovel.area ? `${imovel.area} m²` : "-";
    descricaoImovel.textContent = imovel.descricao || "Descrição não informada.";

    if (localizacaoImovel) {
        localizacaoImovel.textContent = [imovel.bairro, imovel.cidade].filter(Boolean).join(", ");
    }

    const valor = Number(imovel.valor) || 0;
    const taxa = valor * 0.05;
    const total = valor + taxa;

    precoImovel.textContent = formatarPreco(valor);
    valorAluguel.textContent = formatarPreco(valor);
    taxaLar.textContent = formatarPreco(taxa);
    totalMensal.textContent = formatarPreco(total);

    const nomeCompleto = [imovel.nome_usuario, imovel.sobrenome_usuario]
        .filter(Boolean)
        .join(" ");

    nomeAnunciante.textContent = nomeCompleto || "Anunciante";
    avatarAnunciante.textContent = criarIniciais(imovel.nome_usuario, imovel.sobrenome_usuario) || "?";

    if (botaoFavoritar) {
        botaoFavoritar.dataset.id = imovel.id;
    }

    carregarGaleria(imovel.fotos, imovel.titulo);
    carregarMapa(imovel);
}

function atualizarBotaoFavorito() {
    if (!botaoFavoritar) {
        return;
    }

    botaoFavoritar.textContent = estaFavoritado ? "♥ Imóvel salvo" : "♡ Salvar imóvel";
    botaoFavoritar.classList.toggle("favoritado", estaFavoritado);
}

async function verificarFavorito() {
    const token = localStorage.getItem("token");

    if (!token || !imovelId) {
        estaFavoritado = false;
        atualizarBotaoFavorito();
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/favoritos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            estaFavoritado = false;
            atualizarBotaoFavorito();
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível verificar os favoritos.");
        }

        const dados = await resposta.json();
        estaFavoritado = (dados.favoritos || []).some(
            imovel => String(imovel.id) === String(imovelId)
        );
        atualizarBotaoFavorito();
    } catch (erro) {
        console.error("Erro ao verificar favorito:", erro);
    }
}

async function alterarFavorito(metodo, estadoFinal) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        botaoFavoritar.disabled = true;

        const resposta = await fetch(`${API_URL}/api/favoritos/${imovelId}`, {
            method: metodo,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || "Não foi possível atualizar o favorito.");
        }

        estaFavoritado = estadoFinal;
        atualizarBotaoFavorito();
    } catch (erro) {
        console.error("Erro ao atualizar favorito:", erro);
        alert(erro.message);
    } finally {
        botaoFavoritar.disabled = false;
    }
}

async function alternarFavorito() {
    if (estaFavoritado) {
        await alterarFavorito("DELETE", false);
        return;
    }

    await alterarFavorito("POST", true);
}

function mostrarErro(mensagem) {
    tituloImovel.textContent = mensagem;
    tipoImovel.textContent = "";
    enderecoImovel.textContent = "";

    if (imagemPrincipal) {
        imagemPrincipal.src = "img/imovel-sem-foto.png";
    }

    if (imagensSecundarias) {
        imagensSecundarias.innerHTML = "";
    }
}

async function carregarImovel() {
    if (!imovelId) {
        mostrarErro("Imóvel não encontrado.");
        return false;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/imoveis/${imovelId}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível carregar o imóvel.");
        }

        if (!dados.imovel) {
            throw new Error("Imóvel não encontrado.");
        }

        preencherDados(dados.imovel);
        return true;
    } catch (erro) {
        console.error("Erro ao carregar imóvel:", erro);
        mostrarErro(erro.message || "Não foi possível carregar o imóvel.");
        return false;
    }
}

async function iniciarDetalhes() {
    carregarEstilosGaleria();

    const carregou = await carregarImovel();

    if (!carregou) {
        return;
    }

    await verificarFavorito();
}

botaoFavoritar?.addEventListener("click", alternarFavorito);

botaoAlugar?.addEventListener("click", event => {
    const token = localStorage.getItem("token");

    if (!token) {
        return;
    }

    event.preventDefault();
    alert("A função de locação ainda está em desenvolvimento.");
});

document.addEventListener("keydown", event => {
    if (!document.querySelector(".galeria-modal")) {
        return;
    }

    if (event.key === "Escape") {
        fecharGaleria();
    }

    if (event.key === "ArrowLeft") {
        indiceFotoAtual = (indiceFotoAtual - 1 + fotosAtuais.length) % fotosAtuais.length;
        atualizarGaleriaModal();
    }

    if (event.key === "ArrowRight") {
        indiceFotoAtual = (indiceFotoAtual + 1) % fotosAtuais.length;
        atualizarGaleriaModal();
    }
});

document.addEventListener("DOMContentLoaded", iniciarDetalhes);