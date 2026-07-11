function somenteNumeros(valor) {
    if (typeof valor !== "string") {
        return "";
    }

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

function validarEmail(email) {
    if (typeof email !== "string") {
        return false;
    }

    const emailLimpo = email.trim();

    const formatoEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return formatoEmail.test(emailLimpo);
}

function validarTelefone(telefone) {
    const telefoneLimpo = somenteNumeros(telefone);

    return (
        telefoneLimpo.length === 10 ||
        telefoneLimpo.length === 11
    );
}

function validarSenha(senha) {
    if (typeof senha !== "string") {
        return {
            valida: false,
            mensagem: "A senha é obrigatória."
        };
    }

    if (senha.length < 8) {
        return {
            valida: false,
            mensagem:
                "A senha deve possuir pelo menos 8 caracteres."
        };
    }

    if (!/[A-Za-z]/.test(senha)) {
        return {
            valida: false,
            mensagem:
                "A senha deve possuir pelo menos uma letra."
        };
    }

    if (!/\d/.test(senha)) {
        return {
            valida: false,
            mensagem:
                "A senha deve possuir pelo menos um número."
        };
    }

    return {
        valida: true,
        mensagem: null
    };
}

module.exports = {
    somenteNumeros,
    validarCPF,
    validarEmail,
    validarTelefone,
    validarSenha
};

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
    const telefoneLimpo =
        somenteNumeros(telefone);

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