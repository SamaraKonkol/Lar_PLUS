const listaFavoritos =
    document.getElementById("lista-favoritos");

const quantidadeFavoritos =
    document.getElementById("quantidade-favoritos");

const mensagemVazia =
    document.getElementById("mensagem-vazia");


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


function criarCardFavorito(imovel) {
    const foto =
        imovel.foto_principal ||
        "img/imovel-sem-foto.png";

    return `
        <article class="card-imovel">

            <div class="card-imagem">

                <img
                    src="${foto}"
                    alt="${imovel.titulo}"
                >

                <button
                    type="button"
                    class="botao-favoritar favoritado"
                    data-id="${imovel.id}"
                    aria-label="Remover dos favoritos"
                    title="Remover dos favoritos"
                >
                    ♥
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


function renderizarFavoritos(favoritos) {
    quantidadeFavoritos.textContent =
        favoritos.length;

    if (favoritos.length === 0) {
        listaFavoritos.innerHTML = "";
        mensagemVazia.hidden = false;

        return;
    }

    mensagemVazia.hidden = true;

    listaFavoritos.innerHTML =
        favoritos
            .map(criarCardFavorito)
            .join("");
}


async function carregarFavoritos() {
    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href =
            "login.html";

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

            window.location.href =
                "login.html";

            return;
        }

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível carregar os favoritos."
            );
        }

        renderizarFavoritos(
            dados.favoritos || []
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar favoritos:",
            erro
        );

        listaFavoritos.innerHTML = "";

        quantidadeFavoritos.textContent =
            "0";

        mensagemVazia.hidden = false;

        mensagemVazia.innerHTML = `
            <h2>Não foi possível carregar seus favoritos</h2>
            <p>Tente novamente mais tarde.</p>
        `;
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
                "Não foi possível remover o favorito."
            );
        }

        await carregarFavoritos();

    } catch (erro) {
        console.error(
            "Erro ao remover favorito:",
            erro
        );

        alert(erro.message);

        botao.disabled = false;
    }
}


listaFavoritos.addEventListener(
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

        await removerFavorito(
            imovelId,
            botao
        );
    }
);


document.addEventListener(
    "DOMContentLoaded",
    carregarFavoritos
);