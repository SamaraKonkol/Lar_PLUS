const { db } = require("../database/database");
const { uploadImagemS3 } = require("../utils/uploadS3");

async function criarImovel(req, res) {
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

        const imovel_id = resultado.lastInsertRowid;

        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const arquivo = req.files[i];

                const foto_url = await uploadImagemS3(
                    arquivo,
                    `imoveis/${imovel_id}`
                );

                db.prepare(`
                    INSERT INTO imoveis_fotos (
                        imovel_id,
                        foto_url,
                        ordem
                    )
                    VALUES (?, ?, ?)
                `).run(
                    imovel_id,
                    foto_url,
                    i + 1
                );
            }
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: "Imóvel publicado com sucesso!",
            imovel_id
        });

    } catch (erro) {
        console.error("Erro ao criar imóvel:", erro);

        return res.status(500).json({
            erro: "Erro interno ao publicar imóvel."
        });
    }
}

module.exports = {
    criarImovel
};