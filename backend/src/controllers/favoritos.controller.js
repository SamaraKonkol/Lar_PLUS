const { db } = require("../database/database");

function adicionarFavorito(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { imovel_id } = req.params;

        const imovel = db.prepare(`
            SELECT id
            FROM imoveis
            WHERE id = ?
        `).get(imovel_id);

        if (!imovel) {
            return res.status(404).json({
                erro: "Imóvel não encontrado."
            });
        }

        const favoritoExistente = db.prepare(`
            SELECT id
            FROM favoritos
            WHERE usuario_id = ?
            AND imovel_id = ?
        `).get(usuario_id, imovel_id);

        if (favoritoExistente) {
            return res.status(409).json({
                erro: "Este imóvel já está nos favoritos."
            });
        }

        db.prepare(`
            INSERT INTO favoritos (
                usuario_id,
                imovel_id
            )
            VALUES (?, ?)
        `).run(usuario_id, imovel_id);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Imóvel adicionado aos favoritos!"
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao adicionar favorito."
        });
    }
}


function removerFavorito(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { imovel_id } = req.params;

        const resultado = db.prepare(`
            DELETE FROM favoritos
            WHERE usuario_id = ?
            AND imovel_id = ?
        `).run(usuario_id, imovel_id);

        if (resultado.changes === 0) {
            return res.status(404).json({
                erro: "Favorito não encontrado."
            });
        }

        return res.json({
            sucesso: true,
            mensagem: "Imóvel removido dos favoritos."
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao remover favorito."
        });
    }
}


function listarFavoritos(req, res) {
    try {
        const usuario_id = req.usuario.id;

        const favoritos = db.prepare(`
            SELECT
                imoveis.*,

                (
                    SELECT foto_url
                    FROM imoveis_fotos
                    WHERE imoveis_fotos.imovel_id = imoveis.id
                    ORDER BY ordem ASC
                    LIMIT 1
                ) AS foto_principal

            FROM favoritos

            INNER JOIN imoveis
                ON imoveis.id = favoritos.imovel_id

            WHERE favoritos.usuario_id = ?

            ORDER BY favoritos.criado_em DESC
        `).all(usuario_id);

        return res.json({
            sucesso: true,
            favoritos
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro: "Erro ao buscar favoritos."
        });
    }
}


module.exports = {
    adicionarFavorito,
    removerFavorito,
    listarFavoritos
};