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
                sucesso: false,
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
            sucesso: false,
            erro: "Erro interno ao publicar imóvel."
        });
    }
}

function listarImoveis(req, res) {
    try {
        const imoveis = db.prepare(`
            SELECT
                imoveis.id,
                imoveis.usuario_id,
                imoveis.titulo,
                imoveis.descricao,
                imoveis.tipo,
                imoveis.finalidade,
                imoveis.valor,
                imoveis.cidade,
                imoveis.bairro,
                imoveis.endereco,
                imoveis.numero,
                imoveis.complemento,
                imoveis.quartos,
                imoveis.banheiros,
                imoveis.vagas,
                imoveis.area,
                imoveis.status,
                imoveis.criado_em,

                (
                    SELECT foto_url
                    FROM imoveis_fotos
                    WHERE imoveis_fotos.imovel_id = imoveis.id
                    ORDER BY ordem ASC
                    LIMIT 1
                ) AS foto_principal

            FROM imoveis

            WHERE imoveis.status = 'disponivel'

            ORDER BY imoveis.criado_em DESC
        `).all();

        return res.status(200).json({
            sucesso: true,
            quantidade: imoveis.length,
            imoveis
        });

    } catch (erro) {
        console.error("Erro ao listar imóveis:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar imóveis."
        });
    }
}

function buscarImovelPorId(req, res) {
    try {
        const { id } = req.params;

        const imovel = db.prepare(`
            SELECT
                imoveis.id,
                imoveis.usuario_id,
                imoveis.titulo,
                imoveis.descricao,
                imoveis.tipo,
                imoveis.finalidade,
                imoveis.valor,
                imoveis.cidade,
                imoveis.bairro,
                imoveis.endereco,
                imoveis.numero,
                imoveis.complemento,
                imoveis.quartos,
                imoveis.banheiros,
                imoveis.vagas,
                imoveis.area,
                imoveis.status,
                imoveis.criado_em,
                imoveis.atualizado_em,

                usuarios.nome AS nome_usuario,
                usuarios.sobrenome AS sobrenome_usuario

            FROM imoveis

            INNER JOIN usuarios
                ON usuarios.id = imoveis.usuario_id

            WHERE imoveis.id = ?
        `).get(id);

        if (!imovel) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado."
            });
        }

        const fotos = db.prepare(`
            SELECT
                id,
                foto_url,
                ordem
            FROM imoveis_fotos
            WHERE imovel_id = ?
            ORDER BY ordem ASC
        `).all(id);

        return res.status(200).json({
            sucesso: true,
            imovel: {
                ...imovel,
                fotos
            }
        });

    } catch (erro) {
        console.error("Erro ao buscar imóvel:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar imóvel."
        });
    }
}


module.exports = {
    criarImovel,
    listarImoveis,
    buscarImovelPorId
};