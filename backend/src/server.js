const express = require("express");
const cors = require("cors");

const {
    inicializarBanco
} = require("./database/database");

const usuariosRoutes = require("./routes/usuarios.routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/usuarios", usuariosRoutes);

app.get("/", (req, res) => {
    res.json({
        nome: "API Lar+",
        status: "online"
    });
});

inicializarBanco();

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});