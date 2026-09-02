const nodemailer = require("nodemailer");

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"]/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
    })[caractere]);
}

function criarTransportador() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error("SMTP_USER e SMTP_PASS não configurados.");
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

async function enviarEmailRecuperacao(destinatario, nome, link) {
    const transportador = criarTransportador();
    const nomeSeguro = escaparHtml(nome);
    const linkSeguro = escaparHtml(link);

    await transportador.sendMail({
        from: `Lar+ <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: "Redefinição de senha da Lar+",
        text: `Olá, ${nome}. Use este link para redefinir sua senha: ${link}. O link expira em 15 minutos.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#173f45">
                <h1 style="font-size:24px">Redefinição de senha</h1>
                <p>Olá, ${nomeSeguro}.</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta Lar+.</p>
                <p style="margin:28px 0">
                    <a href="${linkSeguro}" style="background:#173f45;color:#faf6ee;padding:12px 20px;border-radius:8px;text-decoration:none">
                        Criar nova senha
                    </a>
                </p>
                <p>Este link é válido por 15 minutos e só pode ser usado uma vez.</p>
                <p>Se você não solicitou a alteração, ignore este e-mail.</p>
            </div>
        `
    });
}

module.exports = { enviarEmailRecuperacao };
