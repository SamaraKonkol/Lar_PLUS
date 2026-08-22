function formatarPrecoDashboard(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarTipoDashboard(tipo) {
    if (!tipo) {
        return "Imóvel";
    }

    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function criarCardImovel(imovel) {
    const artigo = document.createElement("article");
    artigo.className = "imovel-dashboard";

    const imagem = document.createElement("img");
    imagem.className = "imovel-dashboard-imagem";
    imagem.src = imovel.foto_principal || "img/imovel-sem-foto.png";
    imagem.alt = imovel.titulo;
    imagem.onerror = () => {
        imagem.onerror = null;
        imagem.src = "img/imovel-sem-foto.png";
    };

    const conteudo = document.createElement("div");
    conteudo.className = "imovel-dashboard-conteudo";

    const tipo = document.createElement("span");
    tipo.className = "imovel-dashboard-tipo";
    tipo.textContent = formatarTipoDashboard(imovel.tipo);

    const titulo = document.createElement("h3");
    titulo.textContent = imovel.titulo;

    const localizacao = document.createElement("p");
    localizacao.className = "imovel-dashboard-localizacao";
    localizacao.textContent = [imovel.bairro, imovel.cidade].filter(Boolean).join(", ");

    const preco = document.createElement("strong");
    preco.className = "imovel-dashboard-preco";
    preco.textContent = formatarPrecoDashboard(imovel.valor);

    conteudo.append(tipo, titulo, localizacao, preco);

    const acoes = document.createElement("div");
    acoes.className = "acoes-imovel";

    const ver = document.createElement("a");
    ver.className = "botao-ver-imovel";
    ver.href = `detalhes.html?id=${imovel.id}`;
    ver.textContent = "Ver";

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-excluir-imovel";
    excluir.textContent = "Excluir";
    excluir.dataset.id = imovel.id;

    acoes.append(ver, excluir);
    artigo.append(imagem, conteudo, acoes);

    return artigo;
}

async function carregarFavoritosDashboard(token) {
    const totalFavoritos = document.getElementById("total-favoritos");

    try {
        const resposta = await fetch(`${API_URL}/api/favoritos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            return;
        }

        const dados = await resposta.json();

        if (totalFavoritos) {
            totalFavoritos.textContent = String((dados.favoritos || []).length);
        }
    } catch (erro) {
        console.error("Erro ao carregar favoritos do dashboard:", erro);
    }
}

async function carregarMeusImoveis(token) {
    const lista = document.getElementById("lista-meus-imoveis");
    const vazio = document.getElementById("dashboard-vazio");
    const total = document.getElementById("total-meus-imoveis");

    try {
        const resposta = await fetch(`${API_URL}/api/imoveis/meus`, {
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
            throw new Error(dados.erro || "Não foi possível carregar seus imóveis.");
        }

        const imoveis = dados.imoveis || [];

        if (total) {
            total.textContent = String(imoveis.length);
        }

        if (!lista || !vazio) {
            return;
        }

        lista.innerHTML = "";

        if (imoveis.length === 0) {
            vazio.hidden = false;
            return;
        }

        vazio.hidden = true;

        imoveis.forEach(imovel => {
            lista.appendChild(criarCardImovel(imovel));
        });
    } catch (erro) {
        console.error("Erro ao carregar imóveis do dashboard:", erro);

        if (lista) {
            lista.innerHTML = `<p class="carregando">${erro.message}</p>`;
        }
    }
}

async function excluirImovelDashboard(id, token) {
    const confirmou = window.confirm("Deseja realmente excluir este imóvel? Esta ação não poderá ser desfeita.");

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/imoveis/${id}`, {
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
            throw new Error(dados.erro || "Não foi possível excluir o imóvel.");
        }

        await carregarMeusImoveis(token);
    } catch (erro) {
        console.error("Erro ao excluir imóvel:", erro);
        alert(erro.message);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina();

    if (!usuario) {
        return;
    }

    const token = localStorage.getItem("token");
    const nomeDashboard = document.getElementById("nome-dashboard");

    if (nomeDashboard) {
        nomeDashboard.textContent = usuario.nome;
    }

    await Promise.all([
        carregarMeusImoveis(token),
        carregarFavoritosDashboard(token)
    ]);
});

document.addEventListener("click", async event => {
    const botao = event.target.closest(".botao-excluir-imovel");

    if (!botao) {
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    await excluirImovelDashboard(botao.dataset.id, token);
});