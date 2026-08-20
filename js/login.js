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


// Fazer login
formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    try {

        const resposta = await fetch("http://localhost:3000/api/usuarios/login", {
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

        // Salva o JWT no navegador
        localStorage.setItem("token", dados.token);

        // Vai para a página de imóveis
        window.location.href = "catalogo.html";

    } catch (erro) {

        console.error("Erro no login:", erro);

        alert(
            "Não foi possível conectar ao servidor. Verifique se o backend está ligado."
        );

    }

});