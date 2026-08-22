const estaEmDesenvolvimento =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:";

const API_URL = estaEmDesenvolvimento
    ? "http://localhost:3000"
    : "https://larplus-api.onrender.com";