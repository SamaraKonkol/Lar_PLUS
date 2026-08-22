require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { inicializarBanco } = require("./database/database");

const usuariosRoutes = require("./routes/usuarios.routes");
const favoritosRoutes = require("./routes/favoritos.routes");
const imoveisRoutes = require("./routes/imoveis.routes");

const app = express();
const PORT = process.env.PORT || 3000;

const origensPermitidas = new Set([
    "https://samarakonkol.github.io",
    process.env.FRONTEND_URL
].filter(Boolean));

app.use(cors({
    origin(origin, callback) {
        if (
            !origin ||
            origin === "null" ||
            origensPermitidas.has(origin) ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error("Origem não permitida pelo CORS."));
    }
}));

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
});

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/imoveis", imoveisRoutes);
app.use("/api/favoritos", favoritosRoutes);

app.get("/", (req, res) => {
    res.json({
        nome: "API Lar+",
        status: "online"
    });
});

app.use((req, res) => {
    res.status(404).json({
        sucesso: false,
        mensagem: "Rota não encontrada."
    });
});

app.use((erro, req, res, next) => {
    console.error("Erro não tratado:", erro);

    if (res.headersSent) {
        return next(erro);
    }

    const mensagem = erro.message || "Erro interno do servidor.";

    if (
        mensagem.includes("Formato inválido") ||
        mensagem.includes("Campo de arquivo inválido") ||
        erro.code === "LIMIT_FILE_SIZE" ||
        erro.code === "LIMIT_FILE_COUNT" ||
        erro.code === "LIMIT_UNEXPECTED_FILE"
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem
        });
    }

    return res.status(500).json({
        sucesso: false,
        mensagem: "Erro interno do servidor."
    });
});

async function iniciarServidor() {
    try {
        await inicializarBanco();

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (erro) {
        console.error("Erro ao iniciar servidor:", erro);
        process.exit(1);
    }
}

iniciarServidor();