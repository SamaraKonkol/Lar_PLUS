const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { db } = require("../database/database");
const s3 = require("../config/s3");
const { uploadImagemS3 } = require("../utils/uploadS3");

function urlFotoPublica(req, fotoId) {
    return `${req.protocol}://${req.get("host")}/api/imoveis/fotos/${fotoId}`;
}

function obterChaveS3(url) {
    const caminho = new URL(url).pathname.replace(/^\//, "");
    return decodeURIComponent(caminho);
}

async function validarImovelDoUsuario(client, imovelId, usuarioId) {
    const resultado = await client.query(`
        SELECT id
        FROM imoveis
        WHERE id = $1 AND usuario_id = $2
    `, [imovelId, usuarioId]);

    return resultado.rowCount > 0;
}

async function adicionarFotos(req, res) {
    const client = await db.connect();
    const novasFotos = req.files || [];
    const arquivosEnviados = [];

    try {
        const autorizado = await validarImovelDoUsuario(client, req.params.id, req.usuario.id);

        if (!autorizado) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para editá-lo."
            });
        }

        if (novasFotos.length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: "Selecione pelo menos uma foto."
            });
        }

        const contagem = await client.query(
            "SELECT COUNT(*)::int AS total FROM imoveis_fotos WHERE imovel_id = $1",
            [req.params.id]
        );

        const totalAtual = contagem.rows[0].total;

        if (totalAtual + novasFotos.length > 10) {
            return res.status(400).json({
                sucesso: false,
                erro: `O imóvel pode ter no máximo 10 fotos. Você ainda pode adicionar ${Math.max(0, 10 - totalAtual)}.`
            });
        }

        await client.query("BEGIN");

        const ultimaOrdem = await client.query(
            "SELECT COALESCE(MAX(ordem), 0)::int AS ordem FROM imoveis_fotos WHERE imovel_id = $1",
            [req.params.id]
        );

        let ordem = ultimaOrdem.rows[0].ordem;
        const fotosCriadas = [];

        for (const arquivo of novasFotos) {
            const fotoUrl = await uploadImagemS3(
                arquivo,
                `imoveis/${req.params.id}/fotos`
            );

            arquivosEnviados.push(fotoUrl);
            ordem += 1;

            const inserida = await client.query(`
                INSERT INTO imoveis_fotos (imovel_id, foto_url, ordem)
                VALUES ($1, $2, $3)
                RETURNING id, ordem
            `, [req.params.id, fotoUrl, ordem]);

            fotosCriadas.push({
                ...inserida.rows[0],
                foto_url: urlFotoPublica(req, inserida.rows[0].id)
            });
        }

        await client.query("COMMIT");

        return res.status(201).json({
            sucesso: true,
            mensagem: novasFotos.length === 1 ? "Foto adicionada com sucesso." : "Fotos adicionadas com sucesso.",
            fotos: fotosCriadas
        });
    } catch (erro) {
        await client.query("ROLLBACK").catch(() => {});

        await Promise.allSettled(
            arquivosEnviados.map(url => s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: obterChaveS3(url)
            })))
        );

        console.error("Erro ao adicionar fotos:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao adicionar fotos ao imóvel."
        });
    } finally {
        client.release();
    }
}

async function removerFoto(req, res) {
    const client = await db.connect();

    try {
        const autorizado = await validarImovelDoUsuario(client, req.params.id, req.usuario.id);

        if (!autorizado) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para editá-lo."
            });
        }

        const resultado = await client.query(`
            SELECT id, foto_url
            FROM imoveis_fotos
            WHERE id = $1 AND imovel_id = $2
        `, [req.params.fotoId, req.params.id]);

        const foto = resultado.rows[0];

        if (!foto) {
            return res.status(404).json({
                sucesso: false,
                erro: "Foto não encontrada."
            });
        }

        const contagem = await client.query(
            "SELECT COUNT(*)::int AS total FROM imoveis_fotos WHERE imovel_id = $1",
            [req.params.id]
        );

        if (contagem.rows[0].total <= 1) {
            return res.status(400).json({
                sucesso: false,
                erro: "O imóvel precisa manter pelo menos uma foto publicada."
            });
        }

        await client.query("BEGIN");
        await client.query("DELETE FROM imoveis_fotos WHERE id = $1", [foto.id]);

        await client.query(`
            WITH ordenadas AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY ordem ASC, id ASC) AS nova_ordem
                FROM imoveis_fotos
                WHERE imovel_id = $1
            )
            UPDATE imoveis_fotos f
            SET ordem = o.nova_ordem
            FROM ordenadas o
            WHERE f.id = o.id
        `, [req.params.id]);

        await client.query("COMMIT");

        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: obterChaveS3(foto.foto_url)
        })).catch(erro => console.error("Erro ao remover foto do S3:", erro));

        return res.status(200).json({
            sucesso: true,
            mensagem: "Foto removida com sucesso."
        });
    } catch (erro) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Erro ao remover foto:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao remover foto do imóvel."
        });
    } finally {
        client.release();
    }
}

module.exports = {
    adicionarFotos,
    removerFoto
};