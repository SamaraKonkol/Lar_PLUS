const { db } = require("../database/database");

async function adicionarFavorito(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { imovel_id } = req.params;

        const imovel = await db.query(
            "SELECT id FROM imoveis WHERE id = $1",
            [imovel_id]
        );

        if (imovel.rowCount === 0) {
            return res.status(404).json({ erro: "Imóvel não encontrado." });
        }

        const favoritoExistente = await db.query(`
            SELECT id
            FROM favoritos
            WHERE usuario_id = $1 AND imovel_id = $2
        `, [usuario_id, imovel_id]);

        if (favoritoExistente.rowCount > 0) {
            return res.status(409).json({ erro: "Este imóvel já está nos favoritos." });
        }

        await db.query(`
            INSERT INTO favoritos (usuario_id, imovel_id)
            VALUES ($1, $2)
        `, [usuario_id, imovel_id]);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Imóvel adicionado aos favoritos!"
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao adicionar favorito." });
    }
}

async function removerFavorito(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { imovel_id } = req.params;

        const resultado = await db.query(`
            DELETE FROM favoritos
            WHERE usuario_id = $1 AND imovel_id = $2
        `, [usuario_id, imovel_id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: "Favorito não encontrado." });
        }

        return res.json({
            sucesso: true,
            mensagem: "Imóvel removido dos favoritos."
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao remover favorito." });
    }
}

async function listarFavoritos(req, res) {
    try {
        const resultado = await db.query(`
            SELECT
                i.*,
                (
                    SELECT f.id
                    FROM imoveis_fotos f
                    WHERE f.imovel_id = i.id
                    ORDER BY f.ordem ASC
                    LIMIT 1
                ) AS foto_principal_id
            FROM favoritos fav
            INNER JOIN imoveis i ON i.id = fav.imovel_id
            WHERE fav.usuario_id = $1
            ORDER BY fav.criado_em DESC
        `, [req.usuario.id]);

        const favoritos = resultado.rows.map(imovel => ({
            ...imovel,
            foto_principal: imovel.foto_principal_id
                ? `${req.protocol}://${req.get("host")}/api/imoveis/fotos/${imovel.foto_principal_id}`
                : null
        }));

        return res.json({ sucesso: true, favoritos });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: "Erro ao buscar favoritos." });
    }
}

module.exports = {
    adicionarFavorito,
    removerFavorito,
    listarFavoritos
};