document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const usuario =
            await protegerPagina();

        if (!usuario) {
            return;
        }

        const nomeDashboard =
            document.getElementById(
                "nome-dashboard"
            );

        if (nomeDashboard) {
            nomeDashboard.textContent =
                usuario.nome;
        }
    }
);