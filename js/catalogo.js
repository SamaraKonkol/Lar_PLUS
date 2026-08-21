let imoveis = [];
let imoveisFiltrados = [];
let favoritosIds = new Set();

const listaImoveis = document.getElementById("lista-imoveis");
const quantidadeImoveis = document.getElementById("quantidade-imoveis");
const mensagemVazia = document.getElementById("mensagem-vazia");

const formFiltros = document.getElementById("form-filtros");

const filtroCidade = document.getElementById("cidade");
const filtroPreco = document.getElementById("faixa-preco");
const filtroTipo = document.getElementById("tipo-imovel");
const filtroQuartos = document.getElementById("quartos");

const ordenar = document.getElementById("ordenar");

const botoesCategoria = document.querySelectorAll(".categoria");


async function carregarImoveis() {
    try {
        const resposta = await fetch(
            `${API_URL}/api/imoveis`
        );

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar os imóveis."
            );
        }

        const dados = await resposta.json();

        imoveis = dados.imoveis || [];
        imoveisFiltrados = [...imoveis];

    } catch (erro) {
        console.error(
            "Erro ao carregar imóveis:",
            erro
        );

        imoveis = [];
        imoveisFiltrados = [];

        listaImoveis.innerHTML = "";
        quantidadeImoveis.textContent = "0";

        mensagemVazia.hidden = false;

        mensagemVazia.innerHTML = `
            <h2>Não foi possível carregar os imóveis</h2>
            <p>Tente novamente mais tarde.</p>
        `;

        return false;
    }

    return true;
}


async function carregarFavoritos() {
    const token = localStorage.getItem("token");

    favoritosIds.clear();

    if (!token) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/api/favoritos`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar os favoritos."
            );
        }

        const dados = await resposta.json();

        const favoritos = dados.favoritos || [];

        favoritos.forEach((imovel) => {
            favoritosIds.add(
                String(imovel.id)
            );
        });

    } catch (erro) {
        console.error(
            "Erro ao carregar favoritos:",
            erro
        );
    }
}


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


function criarCardImovel(imovel) {
    const foto =
        imovel.foto_principal ||
        "img/imovel-sem-foto.png";

    const estaFavoritado =
        favoritosIds.has(
            String(imovel.id)
        );

    const iconeFavorito =
        estaFavoritado ? "♥" : "♡";

    const classeFavoritado =
        estaFavoritado ? " favoritado" : "";

    const textoAcessibilidade =
        estaFavoritado
            ? "Remover imóvel dos favoritos"
            : "Favoritar imóvel";

    return `
        <article class="card-imovel">

            <div class="card-imagem">

                <img
                    src="${foto}"
                    alt="${imovel.titulo}"
                >

                <button
                    type="button"
                    class="botao-favoritar${classeFavoritado}"
                    data-id="${imovel.id}"
                    aria-label="${textoAcessibilidade}"
                    title="${textoAcessibilidade}"
                >
                    ${iconeFavorito}
                </button>

            </div>

            <div class="card-conteudo">

                <span class="tipo-imovel">
                    ${formatarTipo(imovel.tipo)}
                </span>

                <h2>
                    ${imovel.titulo}
                </h2>

                <p class="localizacao">
                    ${imovel.bairro}, ${imovel.cidade}
                </p>

                <div class="informacoes-imovel">

                    <span>
                        ${imovel.quartos || 0}
                        quarto(s)
                    </span>

                    <span>
                        ${imovel.banheiros || 0}
                        banheiro(s)
                    </span>

                    <span>
                        ${imovel.area || "-"}
                        m²
                    </span>

                </div>

                <div class="card-rodape">

                    <strong class="preco">
                        ${formatarPreco(imovel.valor)}
                    </strong>

                    <a
                        href="detalhes.html?id=${imovel.id}"
                        class="botao-detalhes"
                    >
                        Ver detalhes
                    </a>

                </div>

            </div>

        </article>
    `;
}


function renderizarImoveis(lista) {
    listaImoveis.innerHTML = "";

    quantidadeImoveis.textContent =
        lista.length;

    if (lista.length === 0) {
        mensagemVazia.hidden = false;

        mensagemVazia.innerHTML = `
            <h2>Nenhum imóvel encontrado</h2>
            <p>Tente alterar os filtros da busca.</p>
        `;

        return;
    }

    mensagemVazia.hidden = true;

    listaImoveis.innerHTML = lista
        .map(criarCardImovel)
        .join("");
}


function aplicarFiltros() {
    const cidade = filtroCidade.value;
    const faixaPreco = filtroPreco.value;
    const tipo = filtroTipo.value;
    const quartos = filtroQuartos.value;

    imoveisFiltrados = imoveis.filter(
        (imovel) => {

            if (
                cidade &&
                imovel.cidade !== cidade
            ) {
                return false;
            }

            if (
                tipo &&
                imovel.tipo !== tipo
            ) {
                return false;
            }

            if (quartos) {
                const quantidadeQuartos =
                    Number(imovel.quartos);

                if (
                    quartos === "4" &&
                    quantidadeQuartos < 4
                ) {
                    return false;
                }

                if (
                    quartos !== "4" &&
                    quantidadeQuartos !==
                    Number(quartos)
                ) {
                    return false;
                }
            }

            const valor =
                Number(imovel.valor);

            if (
                faixaPreco === "ate-1500" &&
                valor > 1500
            ) {
                return false;
            }

            if (
                faixaPreco === "1500-2500" &&
                (
                    valor < 1500 ||
                    valor > 2500
                )
            ) {
                return false;
            }

            if (
                faixaPreco === "2500-4000" &&
                (
                    valor < 2500 ||
                    valor > 4000
                )
            ) {
                return false;
            }

            if (
                faixaPreco === "acima-4000" &&
                valor <= 4000
            ) {
                return false;
            }

            return true;
        }
    );

    aplicarOrdenacao();
}


function aplicarOrdenacao() {
    const tipoOrdenacao =
        ordenar.value;

    if (
        tipoOrdenacao === "menor-preco"
    ) {
        imoveisFiltrados.sort(
            (a, b) =>
                Number(a.valor) -
                Number(b.valor)
        );
    }

    if (
        tipoOrdenacao === "maior-preco"
    ) {
        imoveisFiltrados.sort(
            (a, b) =>
                Number(b.valor) -
                Number(a.valor)
        );
    }

    if (
        tipoOrdenacao === "recentes"
    ) {
        imoveisFiltrados.sort(
            (a, b) =>
                new Date(b.criado_em) -
                new Date(a.criado_em)
        );
    }

    renderizarImoveis(
        imoveisFiltrados
    );
}


async function adicionarFavorito(
    imovelId,
    botao
) {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    try {
        botao.disabled = true;

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
            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível favoritar o imóvel."
            );
        }

        favoritosIds.add(
            String(imovelId)
        );

        botao.textContent = "♥";

        botao.classList.add(
            "favoritado"
        );

        botao.setAttribute(
            "aria-label",
            "Remover imóvel dos favoritos"
        );

        botao.title =
            "Remover imóvel dos favoritos";

    } catch (erro) {
        console.error(
            "Erro ao adicionar favorito:",
            erro
        );

        alert(erro.message);

    } finally {
        botao.disabled = false;
    }
}


async function removerFavorito(
    imovelId,
    botao
) {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    try {
        botao.disabled = true;

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
            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível remover o favorito."
            );
        }

        favoritosIds.delete(
            String(imovelId)
        );

        botao.textContent = "♡";

        botao.classList.remove(
            "favoritado"
        );

        botao.setAttribute(
            "aria-label",
            "Favoritar imóvel"
        );

        botao.title =
            "Favoritar imóvel";

    } catch (erro) {
        console.error(
            "Erro ao remover favorito:",
            erro
        );

        alert(erro.message);

    } finally {
        botao.disabled = false;
    }
}


async function alternarFavorito(
    imovelId,
    botao
) {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

        return;
    }

    const estaFavoritado =
        favoritosIds.has(
            String(imovelId)
        );

    if (estaFavoritado) {
        await removerFavorito(
            imovelId,
            botao
        );

        return;
    }

    await adicionarFavorito(
        imovelId,
        botao
    );
}


formFiltros.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();

        aplicarFiltros();
    }
);


ordenar.addEventListener(
    "change",
    aplicarOrdenacao
);


botoesCategoria.forEach(
    (botao) => {

        botao.addEventListener(
            "click",
            () => {

                botoesCategoria.forEach(
                    (item) => {
                        item.classList.remove(
                            "ativa"
                        );
                    }
                );

                botao.classList.add(
                    "ativa"
                );

                filtroTipo.value =
                    botao.dataset.tipo;

                aplicarFiltros();
            }
        );
    }
);


listaImoveis.addEventListener(
    "click",
    async (event) => {

        const botao =
            event.target.closest(
                ".botao-favoritar"
            );

        if (!botao) {
            return;
        }

        const imovelId =
            botao.dataset.id;

        await alternarFavorito(
            imovelId,
            botao
        );
    }
);


async function iniciarCatalogo() {
    const carregou =
        await carregarImoveis();

    if (!carregou) {
        return;
    }

    await carregarFavoritos();

    aplicarFiltros();
}


document.addEventListener(
    "DOMContentLoaded",
    iniciarCatalogo
);