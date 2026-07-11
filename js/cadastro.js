const formulario = document.querySelector(".formulario-cadastro");
const botaoCadastrar = document.querySelector(".botao-cadastrar");

formulario.addEventListener("submit", cadastrarUsuario);

async function cadastrarUsuario(evento) {
    evento.preventDefault();

    const senha = document.querySelector("#senha").value;

    const confirmarSenha =
        document.querySelector("#confirmar-senha").value;

    if (senha !== confirmarSenha) {
        alert("As senhas não são iguais.");
        return;
    }

    const cpf = document.querySelector("#cpf").value;
    const telefone = document.querySelector("#telefone").value;

    if (!validarCPF(cpf)) {
        alert("Informe um CPF válido.");
        return;
    }

    if (!validarTelefone(telefone)) {
        alert("Informe um telefone válido com DDD.");
        return;
    }

    if (!validarSenha(senha)) {
        alert(
            "A senha deve possuir pelo menos 8 caracteres, uma letra e um número."
        );
        return;
    }


    const tipoUsuario = document.querySelector(
        'input[name="tipo-usuario"]:checked'
    );

    const dadosUsuario = {
        nome: document.querySelector("#nome").value,
        sobrenome: document.querySelector("#sobrenome").value,
        email: document.querySelector("#email").value,
        cpf,
        telefone,
        senha
    };

    try {
        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = "Criando conta...";

        const resposta = await fetch(
            "https://larplus-api.onrender.com/api/usuarios",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosUsuario)
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(
                resultado.mensagem ||
                resultado.erro ||
                "Não foi possível cadastrar o usuário."
            );

            return;
        }

        alert("Conta criada com sucesso!");

        console.log("Usuário criado:", resultado.usuario);
        console.log("Objetivo escolhido:", tipoUsuario.value);

        window.location.href = "login.html";
    } catch (erro) {
        console.error("Erro ao cadastrar:", erro);

        alert("Não foi possível conectar ao servidor.");
    } finally {
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Criar minha conta";
    }
}

function somenteNumeros(valor) {
    return valor.replace(/\D/g, "");
}

function validarCPF(cpf) {
    const cpfLimpo = somenteNumeros(cpf);

    if (cpfLimpo.length !== 11) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpfLimpo[i]) * (10 - i);
    }

    let primeiroDigito = (soma * 10) % 11;

    if (primeiroDigito === 10) {
        primeiroDigito = 0;
    }

    if (primeiroDigito !== Number(cpfLimpo[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpfLimpo[i]) * (11 - i);
    }

    let segundoDigito = (soma * 10) % 11;

    if (segundoDigito === 10) {
        segundoDigito = 0;
    }

    return segundoDigito === Number(cpfLimpo[10]);
}

function validarTelefone(telefone) {
    const telefoneLimpo = somenteNumeros(telefone);

    return (
        telefoneLimpo.length === 10 ||
        telefoneLimpo.length === 11
    );
}

function validarSenha(senha) {
    return (
        senha.length >= 8 &&
        /[A-Za-z]/.test(senha) &&
        /\d/.test(senha)
    );
}

// ==========================================
// MOSTRAR E OCULTAR SENHAS
// ==========================================

const botaoSenha = document.querySelector("#mostrarSenha");
const botaoConfirmarSenha = document.querySelector(
    "#mostrarConfirmarSenha"
);

function configurarBotaoSenha(botao, input, icone) {
    if (!botao || !input || !icone) {
        console.error("Elemento do campo de senha não encontrado.");
        return;
    }

    botao.addEventListener("click", () => {
        const estaOculta = input.type === "password";

        input.type = estaOculta
            ? "text"
            : "password";

        icone.src = estaOculta
            ? "img/icon/olho.png"
            : "img/icon/olho (1).png";

        botao.setAttribute(
            "aria-label",
            estaOculta
                ? "Ocultar senha"
                : "Mostrar senha"
        );
    });
}

configurarBotaoSenha(
    botaoSenha,
    document.querySelector("#senha"),
    document.querySelector("#iconeSenha")
);

configurarBotaoSenha(
    botaoConfirmarSenha,
    document.querySelector("#confirmar-senha"),
    document.querySelector("#iconeConfirmarSenha")
);