require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { inicializarBanco } = require("./database/database");

const usuariosRoutes = require("./routes/usuarios.routes");
const favoritosRoutes = require("./routes/favoritos.routes");
const imoveisRoutes = require("./routes/imoveis.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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