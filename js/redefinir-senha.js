const formularioRedefinicao = document.querySelector("#formulario-redefinicao");
const campoNovaSenha = document.querySelector("#senha");
const campoConfirmarSenha = document.querySelector("#confirmar-senha");
const botaoRedefinicao = formularioRedefinicao?.querySelector("button[type='submit']");
const tokenRedefinicao = new URLSearchParams(window.location.search).get("token");

if (!tokenRedefinicao) {
    alert("Link de recuperação inválido. Solicite um novo link.");
    window.location.href = "recuperacao-senha.html";
}

formularioRedefinicao?.addEventListener("submit", async event => {
    event.preventDefault();

    if (campoNovaSenha.value !== campoConfirmarSenha.value) {
        alert("As senhas não coincidem.");
        return;
    }

    const textoOriginal = botaoRedefinicao.textContent;

    try {
        botaoRedefinicao.disabled = true;
        botaoRedefinicao.textContent = "Salvando...";

        const resposta = await fetch(API_URL + "/api/usuarios/senha/redefinir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: tokenRedefinicao,
                senha: campoNovaSenha.value,
                confirmarSenha: campoConfirmarSenha.value
            })
        });
        const dados = await lerRespostaApi(resposta);

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível redefinir a senha.");
        }

        alert(dados.mensagem);
        window.location.href = "login.html";
    } catch (erro) {
        alert(erro.message || "Não foi possível conectar ao servidor.");
    } finally {
        botaoRedefinicao.disabled = false;
        botaoRedefinicao.textContent = textoOriginal;
    }
});
