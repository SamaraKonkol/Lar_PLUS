function obterToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function salvarToken(token, manterConectado = false) {
    removerToken();

    const armazenamento = manterConectado ? localStorage : sessionStorage;
    armazenamento.setItem("token", token);
}

function removerToken() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}

async function verificarUsuarioLogado() {
    const token = obterToken();
    const menuVisitante = document.querySelector(".menu-visitante");
    const menuUsuario = document.querySelector(".menu-usuario");
    const fotoPerfil = document.querySelector(".foto-perfil-header");
    const nomeUsuario = document.querySelector(".nome-usuario-header");

    if (!token) {
        if (menuVisitante) {
            menuVisitante.hidden = false;
        }

        if (menuUsuario) {
            menuUsuario.hidden = true;
        }

        return null;
    }

    try {
        const resposta = await fetch(API_URL + "/api/usuarios/perfil", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!resposta.ok) {
            removerToken();

            if (menuVisitante) {
                menuVisitante.hidden = false;
            }

            if (menuUsuario) {
                menuUsuario.hidden = true;
            }

            return null;
        }

        const dados = await resposta.json();
        const usuario = dados.usuario;

        if (menuVisitante) {
            menuVisitante.hidden = true;
        }

        if (menuUsuario) {
            menuUsuario.hidden = false;
        }

        if (fotoPerfil) {
            fotoPerfil.addEventListener("error", () => {
                if (!fotoPerfil.src.endsWith("/img/avatar-padrao.svg")) {
                    fotoPerfil.src = "img/avatar-padrao.svg";
                }
            });

            fotoPerfil.src = usuario.foto_url || "img/avatar-padrao.svg";
        }

        if (nomeUsuario) {
            nomeUsuario.textContent = usuario.nome || "Perfil";
        }

        return usuario;
    } catch (erro) {
        console.error("Erro ao verificar usuário:", erro);
        return null;
    }
}

function carregarEstilosAvisos() {
    if (document.querySelector('link[href="css/avisos.css"]')) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "css/avisos.css";
    document.head.appendChild(link);
}

function mostrarAvisoInterface(titulo, mensagem, tipo = "sucesso", duracao = 3200) {
    document.querySelector(".aviso-glass")?.remove();

    const aviso = document.createElement("div");
    aviso.className = "aviso-glass aviso-" + tipo;

    const icone = document.createElement("span");
    icone.className = "aviso-glass-icone";
    icone.textContent = tipo === "erro" ? "!" : "✓";

    const conteudo = document.createElement("div");
    const tituloElemento = document.createElement("strong");
    const texto = document.createElement("p");

    tituloElemento.textContent = titulo;
    texto.textContent = mensagem;

    conteudo.append(tituloElemento, texto);
    aviso.append(icone, conteudo);
    document.body.appendChild(aviso);

    requestAnimationFrame(() => aviso.classList.add("visivel"));

    if (duracao > 0) {
        setTimeout(() => {
            aviso.classList.remove("visivel");
            setTimeout(() => aviso.remove(), 250);
        }, duracao);
    }

    return aviso;
}

function logout() {
    removerToken();
    window.location.href = "index.html";
}

function configurarMenuPerfil() {
    const botaoMenu = document.getElementById("botao-menu-perfil");
    const dropdown = document.getElementById("dropdown-perfil");
    const botaoLogout = document.getElementById("botao-logout");

    if (!botaoMenu || !dropdown) {
        return;
    }

    botaoMenu.addEventListener("click", event => {
        event.stopPropagation();

        const estaAberto = !dropdown.hidden;
        dropdown.hidden = estaAberto;
        botaoMenu.setAttribute("aria-expanded", String(!estaAberto));
    });

    document.addEventListener("click", event => {
        if (
            !dropdown.hidden &&
            !dropdown.contains(event.target) &&
            !botaoMenu.contains(event.target)
        ) {
            dropdown.hidden = true;
            botaoMenu.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !dropdown.hidden) {
            dropdown.hidden = true;
            botaoMenu.setAttribute("aria-expanded", "false");
            botaoMenu.focus();
        }
    });

    if (botaoLogout) {
        botaoLogout.addEventListener("click", logout);
    }
}

function configurarRecursosEmDesenvolvimento() {
    document.addEventListener("click", event => {
        const botaoAlugar = event.target.closest("#botao-alugar");
        const botaoVisita = event.target.closest("#botao-visita");

        if (!botaoAlugar && !botaoVisita) {
            return;
        }

        const token = obterToken();

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (botaoAlugar) {
            mostrarAvisoInterface(
                "Locação pela Lar+",
                "Esta função ainda está em desenvolvimento."
            );
            return;
        }

        mostrarAvisoInterface(
            "Agendamento de visita",
            "Esta função ainda está em desenvolvimento."
        );
    }, true);
}

async function protegerPagina() {
    const token = obterToken();

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const resposta = await fetch(API_URL + "/api/usuarios/perfil", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!resposta.ok) {
            removerToken();
            window.location.href = "login.html";
            return null;
        }

        const dados = await resposta.json();
        return dados.usuario;
    } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
        window.location.href = "login.html";
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarEstilosAvisos();
    verificarUsuarioLogado();
    configurarMenuPerfil();
    configurarRecursosEmDesenvolvimento();
});
