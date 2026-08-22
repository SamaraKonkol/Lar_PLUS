const listaFavoritos = document.getElementById("lista-favoritos");
const quantidadeFavoritos = document.getElementById("quantidade-favoritos");
const mensagemVazia = document.getElementById("mensagem-vazia");

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

function criarCardFavorito(imovel) {
    const foto = imovel.foto_principal || "img/imovel-sem-foto.png";

    return `
        <article class="card-imovel" data-id="${imovel.id}" tabindex="0" role="link">
            <div class="card-imagem">
                <img src="${foto}" alt="${imovel.titulo}">
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
                <span class="tipo-imovel">${formatarTipo(imovel.tipo)}</span>
                <h2>${imovel.titulo}</h2>
                <p class="localizacao">${imovel.bairro}, ${imovel.cidade}</p>

                <div class="informacoes-imovel">
                    <span>${imovel.quartos || 0} quarto(s)</span>
                    <span>${imovel.banheiros || 0} banheiro(s)</span>
                    <span>${imovel.area || "-"} m²</span>
                </div>

                <div class="card-rodape">
                    <strong class="preco">${formatarPreco(imovel.valor)}</strong>
                    <a href="detalhes.html?id=${imovel.id}" class="botao-detalhes">Ver detalhes</a>
                </div>
            </div>
        </article>
    `;
}

function renderizarFavoritos(favoritos) {
    quantidadeFavoritos.textContent = favoritos.length;

    if (favoritos.length === 0) {
        listaFavoritos.innerHTML = "";
        mensagemVazia.hidden = false;
        return;
    }

    mensagemVazia.hidden = true;
    listaFavoritos.innerHTML = favoritos.map(criarCardFavorito).join("");
}

async function carregarFavoritos() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/favoritos`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível carregar os favoritos."
            );
        }

        renderizarFavoritos(dados.favoritos || []);
    } catch (erro) {
        console.error("Erro ao carregar favoritos:", erro);
        listaFavoritos.innerHTML = "";
        quantidadeFavoritos.textContent = "0";
        mensagemVazia.hidden = false;
        mensagemVazia.innerHTML = `
            <h2>Não foi possível carregar seus favoritos</h2>
            <p>Tente novamente mais tarde.</p>
        `;
    }
}

async function removerFavorito(imovelId, botao) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        botao.disabled = true;

        const resposta = await fetch(`${API_URL}/api/favoritos/${imovelId}`, {
            method: "DELETE",
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
            throw new Error(
                dados.erro ||
                dados.mensagem ||
                "Não foi possível remover o favorito."
            );
        }

        await carregarFavoritos();
    } catch (erro) {
        console.error("Erro ao remover favorito:", erro);
        mostrarAvisoInterface(
            "Não foi possível remover",
            erro.message,
            "erro"
        );
        botao.disabled = false;
    }
}

function abrirDetalhesCard(card) {
    const id = card?.dataset.id;

    if (id) {
        window.location.href = `detalhes.html?id=${id}`;
    }
}

listaFavoritos.addEventListener("click", async event => {
    const botao = event.target.closest(".botao-favoritar");

    if (botao) {
        event.stopPropagation();
        await removerFavorito(botao.dataset.id, botao);
        return;
    }

    if (event.target.closest(".botao-detalhes")) {
        return;
    }

    abrirDetalhesCard(event.target.closest(".card-imovel"));
});

listaFavoritos.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const card = event.target.closest(".card-imovel");

    if (!card || event.target.closest("button, a")) {
        return;
    }

    event.preventDefault();
    abrirDetalhesCard(card);
});

document.addEventListener("DOMContentLoaded", carregarFavoritos);