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

let estaFavoritado = false;


function formatarPreco(valor) {
    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function formatarTipo(tipo) {
    if (!tipo) {
        return "";
    }

    return tipo.charAt(0).toUpperCase() +
        tipo.slice(1);
}


function criarIniciais(nome, sobrenome) {
    const primeiraInicial = nome
        ? nome.charAt(0).toUpperCase()
        : "";

    const segundaInicial = sobrenome
        ? sobrenome.charAt(0).toUpperCase()
        : "";

    return primeiraInicial + segundaInicial;
}


function carregarGaleria(fotos, titulo) {
    if (!fotos || fotos.length === 0) {
        imagemPrincipal.src =
            "img/imovel-sem-foto.png";

        imagemPrincipal.alt =
            `Imóvel ${titulo}`;

        imagensSecundarias.innerHTML = "";

        return;
    }

    imagemPrincipal.src =
        fotos[0].foto_url;

    imagemPrincipal.alt =
        titulo;

    imagensSecundarias.innerHTML = "";

    const fotosSecundarias =
        fotos.slice(1, 5);

    fotosSecundarias.forEach(
        (foto, indice) => {

            if (
                indice ===
                    fotosSecundarias.length - 1 &&
                fotos.length > 5
            ) {
                const container =
                    document.createElement("div");

                container.classList.add(
                    "ultima-imagem"
                );

                const imagem =
                    document.createElement("img");

                imagem.src =
                    foto.foto_url;

                imagem.alt =
                    titulo;

                const botao =
                    document.createElement("button");

                botao.type =
                    "button";

                botao.textContent =
                    `Ver todas as fotos (${fotos.length})`;

                container.appendChild(
                    imagem
                );

                container.appendChild(
                    botao
                );

                imagensSecundarias.appendChild(
                    container
                );

                return;
            }

            const imagem =
                document.createElement("img");

            imagem.src =
                foto.foto_url;

            imagem.alt =
                titulo;

            imagensSecundarias.appendChild(
                imagem
            );
        }
    );
}


function preencherDados(imovel) {
    document.title =
        `${imovel.titulo} | Lar+`;

    tipoImovel.textContent =
        formatarTipo(imovel.tipo);

    tituloImovel.textContent =
        imovel.titulo;

    const enderecoCompleto = [
        imovel.endereco,
        imovel.numero,
        imovel.bairro,
        imovel.cidade
    ]
        .filter(Boolean)
        .join(", ");

    enderecoImovel.textContent =
        enderecoCompleto;

    quartosImovel.textContent =
        imovel.quartos ?? 0;

    banheirosImovel.textContent =
        imovel.banheiros ?? 0;

    vagasImovel.textContent =
        imovel.vagas ?? 0;

    areaImovel.textContent =
        imovel.area
            ? `${imovel.area} m²`
            : "-";

    descricaoImovel.textContent =
        imovel.descricao ||
        "Descrição não informada.";

    localizacaoImovel.textContent = [
        imovel.bairro,
        imovel.cidade
    ]
        .filter(Boolean)
        .join(", ");

    const valor =
        Number(imovel.valor) || 0;

    const taxa =
        valor * 0.05;

    const total =
        valor + taxa;

    precoImovel.textContent =
        formatarPreco(valor);

    valorAluguel.textContent =
        formatarPreco(valor);

    taxaLar.textContent =
        formatarPreco(taxa);

    totalMensal.textContent =
        formatarPreco(total);

    const nomeCompleto = [
        imovel.nome_usuario,
        imovel.sobrenome_usuario
    ]
        .filter(Boolean)
        .join(" ");

    nomeAnunciante.textContent =
        nomeCompleto ||
        "Anunciante";

    avatarAnunciante.textContent =
        criarIniciais(
            imovel.nome_usuario,
            imovel.sobrenome_usuario
        ) || "?";

    if (botaoFavoritar) {
        botaoFavoritar.dataset.id =
            imovel.id;
    }

    carregarGaleria(
        imovel.fotos,
        imovel.titulo
    );
}


function atualizarBotaoFavorito() {
    if (!botaoFavoritar) {
        return;
    }

    if (estaFavoritado) {
        botaoFavoritar.textContent =
            "♥ Imóvel salvo";

        botaoFavoritar.classList.add(
            "favoritado"
        );

        return;
    }

    botaoFavoritar.textContent =
        "♡ Salvar imóvel";

    botaoFavoritar.classList.remove(
        "favoritado"
    );
}


async function verificarFavorito() {
    const token =
        localStorage.getItem("token");

    if (!token || !imovelId) {
        estaFavoritado = false;
        atualizarBotaoFavorito();
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/api/favoritos`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (
            resposta.status === 401 ||
            resposta.status === 403
        ) {
            localStorage.removeItem(
                "token"
            );

            estaFavoritado = false;

            atualizarBotaoFavorito();

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível verificar os favoritos."
            );
        }

        const dados =
            await resposta.json();

        const favoritos =
            dados.favoritos || [];

        estaFavoritado =
            favoritos.some(
                (imovel) =>
                    String(imovel.id) ===
                    String(imovelId)
            );

        atualizarBotaoFavorito();

    } catch (erro) {
        console.error(
            "Erro ao verificar favorito:",
            erro
        );
    }
}


async function adicionarFavorito() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    try {
        botaoFavoritar.disabled =
            true;

        const resposta = await fetch(
            `${API_URL}/api/favoritos/${imovelId}`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const dados =
            await resposta.json();

        if (
            resposta.status === 401 ||
            resposta.status === 403
        ) {
            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível salvar o imóvel."
            );
        }

        estaFavoritado = true;

        atualizarBotaoFavorito();

    } catch (erro) {
        console.error(
            "Erro ao adicionar favorito:",
            erro
        );

        alert(erro.message);

    } finally {
        botaoFavoritar.disabled =
            false;
    }
}


async function removerFavorito() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    try {
        botaoFavoritar.disabled =
            true;

        const resposta = await fetch(
            `${API_URL}/api/favoritos/${imovelId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const dados =
            await resposta.json();

        if (
            resposta.status === 401 ||
            resposta.status === 403
        ) {
            localStorage.removeItem(
                "token"
            );

            window.location.href =
                "login.html";

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível remover o imóvel dos favoritos."
            );
        }

        estaFavoritado = false;

        atualizarBotaoFavorito();

    } catch (erro) {
        console.error(
            "Erro ao remover favorito:",
            erro
        );

        alert(erro.message);

    } finally {
        botaoFavoritar.disabled =
            false;
    }
}


async function alternarFavorito() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    if (estaFavoritado) {
        await removerFavorito();
        return;
    }

    await adicionarFavorito();
}


function mostrarErro(mensagem) {
    tituloImovel.textContent =
        mensagem;

    tipoImovel.textContent = "";
    enderecoImovel.textContent = "";

    if (imagemPrincipal) {
        imagemPrincipal.src =
            "img/imovel-sem-foto.png";
    }

    if (imagensSecundarias) {
        imagensSecundarias.innerHTML =
            "";
    }
}


async function carregarImovel() {
    if (!imovelId) {
        mostrarErro(
            "Imóvel não encontrado."
        );

        return false;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/api/imoveis/${imovelId}`
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível carregar o imóvel."
            );
        }

        if (!dados.imovel) {
            throw new Error(
                "Imóvel não encontrado."
            );
        }

        preencherDados(
            dados.imovel
        );

        return true;

    } catch (erro) {
        console.error(
            "Erro ao carregar imóvel:",
            erro
        );

        mostrarErro(
            erro.message ||
            "Não foi possível carregar o imóvel."
        );

        return false;
    }
}


async function iniciarDetalhes() {
    const carregou =
        await carregarImovel();

    if (!carregou) {
        return;
    }

    await verificarFavorito();
}


if (botaoFavoritar) {
    botaoFavoritar.addEventListener(
        "click",
        alternarFavorito
    );
}


document.addEventListener(
    "DOMContentLoaded",
    iniciarDetalhes
);