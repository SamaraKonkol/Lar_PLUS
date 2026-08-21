const formulario = document.querySelector(".formulario-login");

const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const botaoMostrarSenha = document.querySelector(".mostrar-senha");


// Mostrar / esconder senha
botaoMostrarSenha.addEventListener("click", () => {

    if (campoSenha.type === "password") {
        campoSenha.type = "text";
    } else {
        campoSenha.type = "password";
    }

});


function obterDestinoAposLogin() {
    const parametros = new URLSearchParams(window.location.search);
    const redirecionarPara = parametros.get("redirect");

    if (!redirecionarPara) {
        return "catalogo.html";
    }

    try {
        const destino = decodeURIComponent(redirecionarPara);

        if (
            destino.startsWith("http://") ||
            destino.startsWith("https://") ||
            destino.startsWith("//")
        ) {
            return "catalogo.html";
        }

        return destino;

    } catch (erro) {
        console.error("Destino de login inválido:", erro);
        return "catalogo.html";
    }
}


// Fazer login
formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    try {

        const resposta = await fetch(`${API_URL}/api/usuarios/login`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    senha
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        localStorage.setItem("token", dados.token);

        window.location.href = obterDestinoAposLogin();

    } catch (erro) {

        console.error("Erro no login:", erro);

        alert(
            "Não foi possível conectar ao servidor. Verifique se o backend está ligado."
        );

    }

});