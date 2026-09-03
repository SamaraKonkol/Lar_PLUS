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
    artigo.dataset.status = imovel.status;

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

    const status = document.createElement("span");
    status.className = "imovel-dashboard-status";
    status.textContent = imovel.status === "inativo" ? "Anúncio inativo" : "Anúncio ativo";

    conteudo.append(tipo, titulo, localizacao, preco, status);

    const acoes = document.createElement("div");
    acoes.className = "acoes-imovel";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "botao-editar-imovel";
    editar.textContent = "Editar";
    editar.dataset.id = imovel.id;

    const alternarStatus = document.createElement("button");
    alternarStatus.type = "button";
    alternarStatus.className = "botao-status-imovel botao-excluir-imovel";
    alternarStatus.dataset.id = imovel.id;
    alternarStatus.dataset.status = imovel.status;
    alternarStatus.textContent = imovel.status === "inativo" ? "Reativar" : "Desativar";

    acoes.append(editar, alternarStatus);
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
            removerToken();
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

async function alterarStatusDashboard(id, statusAtual, token) {
    const novoStatus = statusAtual === "inativo" ? "disponivel" : "inativo";
    const acao = novoStatus === "inativo" ? "desativar" : "reativar";
    const confirmou = window.confirm(`Deseja ${acao} este anúncio?`);

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/imoveis/${id}/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: novoStatus })
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível alterar o status do anúncio.");
        }

        mostrarAvisoInterface(
            novoStatus === "inativo" ? "Anúncio desativado" : "Anúncio reativado",
            dados.mensagem
        );

        await carregarMeusImoveis(token);
    } catch (erro) {
        console.error("Erro ao alterar status do imóvel:", erro);
        mostrarAvisoInterface(
            "Não foi possível alterar o anúncio",
            erro.message,
            "erro"
        );
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina();

    if (!usuario) {
        return;
    }

    const token = obterToken();
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
    const botaoStatus = event.target.closest(".botao-status-imovel");

    if (botaoStatus) {
        const token = obterToken();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        await alterarStatusDashboard(
            botaoStatus.dataset.id,
            botaoStatus.dataset.status,
            token
        );
        return;
    }

    const botaoEditar = event.target.closest(".botao-editar-imovel");

    if (botaoEditar) {
        window.location.href = `editar-imovel.html?id=${encodeURIComponent(botaoEditar.dataset.id)}`;
    }
});
