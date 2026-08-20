const { db } = require("../database/database");

function criarImovel(req, res) {
    try {
        const {
            titulo,
            descricao,
            tipo,
            finalidade,
            valor,
            cidade,
            bairro,
            endereco,
            numero,
            complemento,
            quartos,
            banheiros,
            vagas,
            area
        } = req.body;

        const usuario_id = req.usuario.id;

        if (
            !titulo ||
            !descricao ||
            !tipo ||
            !valor ||
            !cidade ||
            !bairro ||
            !endereco
        ) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios."
            });
        }

        const stmt = db.prepare(`
            INSERT INTO imoveis (
                usuario_id,
                titulo,
                descricao,
                tipo,
                finalidade,
                valor,
                cidade,
                bairro,
                endereco,
                numero,
                complemento,
                quartos,
                banheiros,
                vagas,
                area
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const resultado = stmt.run(
            usuario_id,
            titulo,
            descricao,
            tipo,
            finalidade || "aluguel",
            valor,
            cidade,
            bairro,
            endereco,
            numero || null,
            complemento || null,
            quartos || 0,
            banheiros || 0,
            vagas || 0,
            area || null
        );

        return res.status(201).json({
            mensagem: "Imóvel publicado com sucesso!",
            imovel_id: resultado.lastInsertRowid
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao publicar imóvel."
        });
    }
}

module.exports = {
    criarImovel
};