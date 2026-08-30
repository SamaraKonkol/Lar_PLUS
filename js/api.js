const temaLarPlus = document.createElement("link");
temaLarPlus.rel = "stylesheet";
temaLarPlus.href = "css/theme.css?v=20260830";
temaLarPlus.dataset.larplusTheme = "true";

document.head.appendChild(temaLarPlus);

const estaEmDesenvolvimento =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:";

const API_URL = estaEmDesenvolvimento
    ? "http://localhost:3000"
    : "https://larplus-api.onrender.com";

async function lerRespostaApi(resposta) {
    const texto = await resposta.text();
    let dados = null;

    if (texto) {
        try {
            dados = JSON.parse(texto);
        } catch (erro) {
            dados = null;
        }
    }

    if (dados) {
        return dados;
    }

    if (resposta.status === 413) {
        throw new Error("A imagem ultrapassou o limite aceito pelo servidor.");
    }

    if (resposta.status === 404 || resposta.status === 405) {
        throw new Error("A edição de perfil ainda não está disponível na API. Aguarde o deploy do backend e tente novamente.");
    }

    if ([502, 503, 504].includes(resposta.status)) {
        throw new Error("A API está temporariamente indisponível. Aguarde alguns instantes e tente novamente.");
    }

    throw new Error("A API respondeu em um formato inesperado. Tente novamente em alguns instantes.");
}
