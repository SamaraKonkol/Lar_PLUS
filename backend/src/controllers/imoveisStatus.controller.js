const { db } = require("../database/database");

async function alterarStatusImovel(req, res) {
    const { status } = req.body;
    const permitidos = new Set(["disponivel", "inativo"]);

    if (!permitidos.has(status)) {
        return res.status(400).json({
            sucesso: false,
            erro: "Status inválido."
        });
    }

    try {
        const resultado = await db.query(`
            UPDATE imoveis
            SET status = $1, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $2 AND usuario_id = $3
            RETURNING id, status
        `, [status, req.params.id, req.usuario.id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para alterá-lo."
            });
        }

        return res.status(200).json({
            sucesso: true,
            mensagem: status === "disponivel" ? "Anúncio reativado com sucesso." : "Anúncio desativado com sucesso.",
            imovel: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao alterar status do imóvel:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao alterar status do imóvel."
        });
    }
}

module.exports = {
    alterarStatusImovel
};
