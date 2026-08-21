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
const botaoVisita = document.getElementById("botao-visita");

const modalGaleria = document.getElementById("modal-galeria");
const imagemModalGaleria = document.getElementById("imagem-modal-galeria");
const contadorGaleria = document.getElementById("contador-galeria");
const botaoFotoAnterior = document.getElementById("foto-anterior");
const botaoProximaFoto = document.getElementById("proxima-foto");
const botaoFecharGaleria = document.getElementById("fechar-galeria");

const modalVisita = document.getElementById("modal-visita");
const botaoFecharVisita = document.getElementById("fechar-visita");
const formAgendarVisita = document.getElementById("form-agendar-visita");
const dataVisita = document.getElementById("data-visita");
const horaVisita = document.getElementById("hora-visita");
const mensagemVisita = document.getElementById("mensagem-visita");

let estaFavoritado = false;
let fotosImovel = [];
let indiceFotoAtual = 0;

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarTipo(tipo) {
    if (!tipo) return "";
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function criarIniciais(nome, sobrenome) {
    const primeiraInicial = nome ? nome.charAt(0).toUpperCase() : "";
    const segundaInicial = sobrenome ? sobrenome.charAt(0).toUpperCase() : "";
    return primeiraInicial + segundaInicial;
}

function abrirGaleria(indice = 0) {
    if (!fotosImovel.length || !modalGaleria) return;

    indiceFotoAtual = indice;
    atualizarGaleriaModal();

    modalGaleria.hidden = false;
    modalGaleria.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-aberto");
}

function fecharGaleria() {
    if (!modalGaleria) return;
    modalGaleria.hidden = true;
    modalGaleria.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-aberto");
}

function atualizarGaleriaModal() {
    if (!fotosImovel.length) return;

    const foto = fotosImovel[indiceFotoAtual];
    imagemModalGaleria.src = foto.foto_url;
    imagemModalGaleria.alt = `Foto ${indiceFotoAtual + 1} do imóvel`;
    contadorGaleria.textContent = `${indiceFotoAtual + 1} / ${fotosImovel.length}`;

    const temVariasFotos = fotosImovel.length > 1;
    botaoFotoAnterior.hidden = !temVariasFotos;
    botaoProximaFoto.hidden = !temVariasFotos;
}

function fotoAnterior() {
    if (!fotosImovel.length) return;
    indiceFotoAtual = (indiceFotoAtual - 1 + fotosImovel.length) % fotosImovel.length;
    atualizarGaleriaModal();
}

function proximaFoto() {
    if (!fotosImovel.length) return;
    indiceFotoAtual = (indiceFotoAtual + 1) % fotosImovel.length;
    atualizarGaleriaModal();
}

function carregarGaleria(fotos, titulo) {
    fotosImovel = Array.isArray(fotos) ? fotos : [];

    if (fotosImovel.length === 0) {
        imagemPrincipal.src = "img/imovel-sem-foto.png";
        imagemPrincipal.alt = `Imóvel ${titulo}`;
        imagensSecundarias.innerHTML = "";
        return;
    }

    imagemPrincipal.src = fotosImovel[0].foto_url;
    imagemPrincipal.alt = titulo;
    imagemPrincipal.style.cursor = "pointer";
    imagemPrincipal.onclick = () => abrirGaleria(0);

    imagensSecundarias.innerHTML = "";

    const fotosSecundarias = fotosImovel.slice(1, 5);

    fotosSecundarias.forEach((foto, indice) => {
        const indiceReal = indice + 1;

        if (
            indice === fotosSecundarias.length - 1 &&
            fotosImovel.length > 5
        ) {
            const container = document.createElement("div");
            container.classList.add("ultima-imagem");

            const imagem = document.createElement("img");
            imagem.src = foto.foto_url;
            imagem.alt = titulo;

            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = `Ver todas as fotos (${fotosImovel.length})`;
            botao.addEventListener("click", () => abrirGaleria(indiceReal));

            container.appendChild(imagem);
            container.appendChild(botao);
            imagensSecundarias.appendChild(container);
            return;
        }

        const imagem = document.createElement("img");
        imagem.src = foto.foto_url;
        imagem.alt = titulo;
        imagem.style.cursor = "pointer";
        imagem.addEventListener("click", () => abrirGaleria(indiceReal));
        imagensSecundarias.appendChild(imagem);
    });
}

function preencherDados(imovel) {
    document.title = `${imovel.titulo} | Lar+`;
    tipoImovel.textContent = formatarTipo(imovel.tipo);
    tituloImovel.textContent = imovel.titulo;

    enderecoImovel.textContent = [
        imovel.endereco,
        imovel.numero,
        imovel.bairro,
        imovel.cidade
    ].filter(Boolean).join(", ");

    quartosImovel.textContent = imovel.quartos ?? 0;
    banheirosImovel.textContent = imovel.banheiros ?? 0;
    vagasImovel.textContent = imovel.vagas ?? 0;
    areaImovel.textContent = imovel.area ? `${imovel.area} m²` : "-";

    descricaoImovel.textContent = imovel.descricao || "Descrição não informada.";
    localizacaoImovel.textContent = [imovel.bairro, imovel.cidade].filter(Boolean).join(", ");

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
    avatarAnunciante.textContent = criarIniciais(
        imovel.nome_usuario,
        imovel.sobrenome_usuario
    ) || "?";

    if (botaoFavoritar) {
        botaoFavoritar.dataset.id = imovel.id;
    }

    carregarGaleria(imovel.fotos, imovel.titulo);
}

function atualizarBotaoFavorito() {
    if (!botaoFavoritar) return;

    if (estaFavoritado) {
        botaoFavoritar.textContent = "♥ Imóvel salvo";
        botaoFavoritar.classList.add("favoritado");
        return;
    }

    botaoFavoritar.textContent = "♡ Salvar imóvel";
    botaoFavoritar.classList.remove("favoritado");
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
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
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
        const favoritos = dados.favoritos || [];

        estaFavoritado = favoritos.some(
            (imovel) => String(imovel.id) === String(imovelId)
        );

        atualizarBotaoFavorito();
    } catch (erro) {
        console.error("Erro ao verificar favorito:", erro);
    }
}

async function adicionarFavorito() {
    const token = localStorage.getItem("token");

    if (!token) {
        redirecionarParaLogin(`detalhes.html?id=${imovelId}`);
        return;
    }

    try {
        botaoFavoritar.disabled = true;

        const resposta = await fetch(`${API_URL}/api/favoritos/${imovelId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            redirecionarParaLogin(`detalhes.html?id=${imovelId}`);
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.mensagem || "Não foi possível salvar o imóvel."
            );
        }

        estaFavoritado = true;
        atualizarBotaoFavorito();
    } catch (erro) {
        console.error("Erro ao adicionar favorito:", erro);
        alert(erro.message);
    } finally {
        botaoFavoritar.disabled = false;
    }
}

async function removerFavorito() {
    const token = localStorage.getItem("token");

    if (!token) {
        redirecionarParaLogin(`detalhes.html?id=${imovelId}`);
        return;
    }

    try {
        botaoFavoritar.disabled = true;

        const resposta = await fetch(`${API_URL}/api/favoritos/${imovelId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            redirecionarParaLogin(`detalhes.html?id=${imovelId}`);
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.mensagem || "Não foi possível remover o imóvel dos favoritos."
            );
        }

        estaFavoritado = false;
        atualizarBotaoFavorito();
    } catch (erro) {
        console.error("Erro ao remover favorito:", erro);
        alert(erro.message);
    } finally {
        botaoFavoritar.disabled = false;
    }
}

async function alternarFavorito() {
    if (estaFavoritado) {
        await removerFavorito();
        return;
    }

    await adicionarFavorito();
}

function redirecionarParaLogin(destino) {
    window.location.href = `login.html?redirect=${encodeURIComponent(destino)}`;
}

async function usuarioEstaAutenticado() {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
        const resposta = await fetch(`${API_URL}/api/usuarios/perfil`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!resposta.ok) {
            localStorage.removeItem("token");
            return false;
        }

        return true;
    } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
        return false;
    }
}

async function iniciarLocacao() {
    const autenticado = await usuarioEstaAutenticado();
    const destino = `locacao.html?id=${imovelId}`;

    if (!autenticado) {
        redirecionarParaLogin(destino);
        return;
    }

    window.location.href = destino;
}

function abrirModalVisita() {
    modalVisita.hidden = false;
    modalVisita.setAttribute("aria-hidden", "false");
    mensagemVisita.hidden = true;
    mensagemVisita.textContent = "";
    document.body.classList.add("modal-aberto");

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    dataVisita.min = `${ano}-${mes}-${dia}`;
}

function fecharModalVisita() {
    modalVisita.hidden = true;
    modalVisita.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-aberto");
}

async function iniciarAgendamentoVisita() {
    const autenticado = await usuarioEstaAutenticado();

    if (!autenticado) {
        redirecionarParaLogin(`detalhes.html?id=${imovelId}&agendar=1`);
        return;
    }

    abrirModalVisita();
}

function enviarSolicitacaoVisita(event) {
    event.preventDefault();

    if (!dataVisita.value || !horaVisita.value) {
        return;
    }

    mensagemVisita.hidden = false;
    mensagemVisita.textContent =
        "Solicitação preparada! A API de visitas será conectada quando criarmos o módulo de agendamentos.";

    formAgendarVisita.reset();
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
    const carregou = await carregarImovel();
    if (!carregou) return;

    await verificarFavorito();

    if (parametros.get("agendar") === "1") {
        const autenticado = await usuarioEstaAutenticado();
        if (autenticado) abrirModalVisita();
    }
}

if (botaoFavoritar) {
    botaoFavoritar.addEventListener("click", alternarFavorito);
}

if (botaoAlugar) {
    botaoAlugar.addEventListener("click", iniciarLocacao);
}

if (botaoVisita) {
    botaoVisita.addEventListener("click", iniciarAgendamentoVisita);
}

if (botaoFecharGaleria) {
    botaoFecharGaleria.addEventListener("click", fecharGaleria);
}

if (botaoFotoAnterior) {
    botaoFotoAnterior.addEventListener("click", fotoAnterior);
}

if (botaoProximaFoto) {
    botaoProximaFoto.addEventListener("click", proximaFoto);
}

if (botaoFecharVisita) {
    botaoFecharVisita.addEventListener("click", fecharModalVisita);
}

if (formAgendarVisita) {
    formAgendarVisita.addEventListener("submit", enviarSolicitacaoVisita);
}

document.querySelectorAll("[data-fechar-galeria]").forEach((elemento) => {
    elemento.addEventListener("click", fecharGaleria);
});

document.querySelectorAll("[data-fechar-visita]").forEach((elemento) => {
    elemento.addEventListener("click", fecharModalVisita);
});

document.addEventListener("keydown", (event) => {
    if (!modalGaleria.hidden) {
        if (event.key === "Escape") fecharGaleria();
        if (event.key === "ArrowLeft") fotoAnterior();
        if (event.key === "ArrowRight") proximaFoto();
        return;
    }

    if (!modalVisita.hidden && event.key === "Escape") {
        fecharModalVisita();
    }
});

document.addEventListener("DOMContentLoaded", iniciarDetalhes);