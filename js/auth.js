async function verificarUsuarioLogado() {
    const token = localStorage.getItem("token");
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
        const resposta = await fetch(`${API_URL}/api/usuarios/perfil`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            localStorage.removeItem("token");

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
            fotoPerfil.src = usuario.foto_url || "img/avatar-padrao.png";
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
    aviso.className = `aviso-glass aviso-${tipo}`;

    const icone = document.createElement("span");
    icone.className = "aviso-glass-icone";
    icone.textContent = tipo === "erro" ? "!" : "i";

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
    localStorage.removeItem("token");
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
    document.querySelectorAll('a[href="editar-perfil.html"]').forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            mostrarAvisoInterface(
                "Edição de perfil",
                "Esta função ainda está em desenvolvimento."
            );
        });
    });
}

async function protegerPagina() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/usuarios/perfil`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            localStorage.removeItem("token");
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