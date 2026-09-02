const formularioRecuperacao = document.querySelector("#formulario-recuperacao");
const emailRecuperacao = document.querySelector("#email");
const botaoRecuperacao = formularioRecuperacao?.querySelector("button[type='submit']");
const emailUrl = new URLSearchParams(window.location.search).get("email");

if (emailUrl) {
    emailRecuperacao.value = emailUrl;
}

formularioRecuperacao?.addEventListener("submit", async event => {
    event.preventDefault();
    const textoOriginal = botaoRecuperacao.textContent;

    try {
        botaoRecuperacao.disabled = true;
        botaoRecuperacao.textContent = "Enviando...";

        const resposta = await fetch(API_URL + "/api/usuarios/senha/solicitar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailRecuperacao.value.trim() })
        });
        const dados = await lerRespostaApi(resposta);

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível solicitar a recuperação.");
        }

        alert(dados.mensagem);
    } catch (erro) {
        alert(erro.message || "Não foi possível conectar ao servidor.");
    } finally {
        botaoRecuperacao.disabled = false;
        botaoRecuperacao.textContent = textoOriginal;
    }
});
