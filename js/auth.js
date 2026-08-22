function estaNaPaginaInicial() {
    const pagina = window.location.pathname
        .split("/")
        .pop();

    return (
        pagina === "" ||
        pagina === "index.html"
    );
}

async function verificarUsuarioLogado() {
    const token = localStorage.getItem("token");

    const menuVisitante =
        document.querySelector(".menu-visitante");

    const menuUsuario =
        document.querySelector(".menu-usuario");

    const fotoPerfil =
        document.querySelector(".foto-perfil-header");

    const nomeUsuario =
        document.querySelector(".nome-usuario-header");

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
        const resposta = await fetch(
            `${API_URL}/api/usuarios/perfil`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

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

        if (estaNaPaginaInicial()) {
            window.location.href = "dashboard.html";
            return usuario;
        }

        if (menuVisitante) {
            menuVisitante.hidden = true;
        }

        if (menuUsuario) {
            menuUsuario.hidden = false;
        }

        if (fotoPerfil) {
            fotoPerfil.src =
                usuario.foto_url ||
                "img/avatar-padrao.png";
        }

        if (nomeUsuario) {
            nomeUsuario.textContent =
                usuario.nome || "Perfil";
        }

        return usuario;

    } catch (erro) {
        console.error(
            "Erro ao verificar usuário:",
            erro
        );

        return null;
    }
}


function logout() {
    localStorage.removeItem("token");

    window.location.href = "index.html";
}


function configurarMenuPerfil() {
    const botaoMenu =
        document.getElementById(
            "botao-menu-perfil"
        );

    const dropdown =
        document.getElementById(
            "dropdown-perfil"
        );

    const botaoLogout =
        document.getElementById(
            "botao-logout"
        );

    if (!botaoMenu || !dropdown) {
        return;
    }

    botaoMenu.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            const estaAberto =
                !dropdown.hidden;

            dropdown.hidden =
                estaAberto;

            botaoMenu.setAttribute(
                "aria-expanded",
                String(!estaAberto)
            );
        }
    );

    document.addEventListener(
        "click",
        (event) => {
            if (
                !dropdown.hidden &&
                !dropdown.contains(event.target) &&
                !botaoMenu.contains(event.target)
            ) {
                dropdown.hidden = true;

                botaoMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !dropdown.hidden
            ) {
                dropdown.hidden = true;

                botaoMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );

                botaoMenu.focus();
            }
        }
    );

    if (botaoLogout) {
        botaoLogout.addEventListener(
            "click",
            logout
        );
    }
}

async function protegerPagina() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/api/usuarios/perfil`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return null;
        }

        const dados = await resposta.json();

        return dados.usuario;

    } catch (erro) {
        console.error(
            "Erro ao validar sessão:",
            erro
        );

        window.location.href =
            "login.html";

        return null;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {
        verificarUsuarioLogado();
        configurarMenuPerfil();
    }
);