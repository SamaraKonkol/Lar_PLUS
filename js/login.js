const formulario = document.querySelector(".formulario-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const campoManterConectado = document.querySelector('[name="lembrar"]');
const botaoMostrarSenha = document.querySelector(".mostrar-senha");
const botaoEntrar = document.querySelector(".botao-entrar");

botaoMostrarSenha?.addEventListener("click", () => {
    const mostrar = campoSenha.type === "password";
    campoSenha.type = mostrar ? "text" : "password";
    botaoMostrarSenha.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
});

formulario?.addEventListener("submit", async event => {
    event.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;
    const manterConectado = Boolean(campoManterConectado?.checked);
    const textoOriginal = botaoEntrar.textContent;

    try {
        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Entrando...";

        const resposta = await fetch(API_URL + "/api/usuarios/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                senha,
                manterConectado
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "E-mail ou senha inválidos.");
        }

        salvarToken(dados.token, manterConectado);
        window.location.href = "catalogo.html";
    } catch (erro) {
        alert(erro.message || "Não foi possível conectar ao servidor.");
    } finally {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = textoOriginal;
    }
});
