const { GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { db } = require("../database/database");
const s3 = require("../config/s3");
const { uploadImagemS3 } = require("../utils/uploadS3");

function paraNumero(valor, padrao = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : padrao;
}

function paraBooleano(valor) {
    return valor === true || valor === "true" || valor === "1" || valor === "on";
}

function urlFotoPublica(req, fotoId) {
    if (!fotoId) {
        return null;
    }

    return `${req.protocol}://${req.get("host")}/api/imoveis/fotos/${fotoId}`;
}

function obterChaveS3(url) {
    const caminho = new URL(url).pathname.replace(/^\//, "");
    return decodeURIComponent(caminho);
}

async function excluirArquivoS3(url) {
    if (!url) {
        return;
    }

    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: obterChaveS3(url)
    }));
}

async function salvarArquivos(client, imovelId, files) {
    const fotos = files?.fotos || [];

    for (let i = 0; i < fotos.length; i++) {
        const fotoUrl = await uploadImagemS3(
            fotos[i],
            `imoveis/${imovelId}/fotos`
        );

        await client.query(`
            INSERT INTO imoveis_fotos (imovel_id, foto_url, ordem)
            VALUES ($1, $2, $3)
        `, [imovelId, fotoUrl, i + 1]);
    }

    const documentos = [
        ["matricula", "matricula"],
        ["comprovante_propriedade", "comprovante_propriedade"],
        ["iptu_documento", "iptu"]
    ];

    for (const [campo, tipo] of documentos) {
        const arquivo = files?.[campo]?.[0];

        if (!arquivo) {
            continue;
        }

        const arquivoUrl = await uploadImagemS3(
            arquivo,
            `imoveis/${imovelId}/documentos`
        );

        await client.query(`
            INSERT INTO imoveis_documentos (
                imovel_id,
                tipo,
                arquivo_url,
                nome_original
            )
            VALUES ($1, $2, $3, $4)
        `, [imovelId, tipo, arquivoUrl, arquivo.originalname]);
    }
}

async function criarImovel(req, res) {
    const client = await db.connect();
    let imovelId = null;

    try {
        const {
            titulo,
            descricao,
            tipo,
            finalidade,
            valor,
            cep,
            estado,
            cidade,
            bairro,
            endereco,
            numero,
            complemento,
            ocultar_numero,
            quartos,
            suites,
            banheiros,
            vagas,
            area,
            area_construida,
            condominio,
            iptu,
            seguro,
            financiamento,
            reserva_percentual,
            disponibilidade,
            contrato_minimo,
            regras_adicionais,
            aceita_animais,
            aceita_criancas,
            permite_fumar,
            entrada_imediata,
            comodidades
        } = req.body;

        if (!titulo || !descricao || !tipo || !valor || !cidade || !bairro || !endereco) {
            return res.status(400).json({
                sucesso: false,
                erro: "Preencha todos os campos obrigatórios."
            });
        }

        await client.query("BEGIN");

        const resultadoImovel = await client.query(`
            INSERT INTO imoveis (
                usuario_id,
                titulo,
                descricao,
                tipo,
                finalidade,
                valor,
                cep,
                estado,
                cidade,
                bairro,
                endereco,
                numero,
                complemento,
                ocultar_numero,
                quartos,
                suites,
                banheiros,
                vagas,
                area,
                area_construida
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING id
        `, [
            req.usuario.id,
            titulo.trim(),
            descricao.trim(),
            tipo,
            finalidade || "aluguel",
            paraNumero(valor),
            cep || null,
            estado || null,
            cidade.trim(),
            bairro.trim(),
            endereco.trim(),
            numero || null,
            complemento || null,
            paraBooleano(ocultar_numero),
            paraNumero(quartos),
            paraNumero(suites),
            paraNumero(banheiros),
            paraNumero(vagas),
            area ? paraNumero(area) : null,
            area_construida ? paraNumero(area_construida) : null
        ]);

        imovelId = resultadoImovel.rows[0].id;

        await client.query(`
            INSERT INTO imoveis_valores (
                imovel_id,
                condominio,
                iptu,
                seguro,
                financiamento,
                reserva_percentual
            )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            imovelId,
            paraNumero(condominio),
            paraNumero(iptu),
            paraNumero(seguro),
            paraNumero(financiamento),
            paraNumero(reserva_percentual, 10)
        ]);

        await client.query(`
            INSERT INTO imoveis_regras (
                imovel_id,
                disponibilidade,
                contrato_minimo,
                regras_adicionais,
                aceita_animais,
                aceita_criancas,
                permite_fumar,
                entrada_imediata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            imovelId,
            disponibilidade || null,
            paraNumero(contrato_minimo, 12),
            regras_adicionais || null,
            paraBooleano(aceita_animais),
            paraBooleano(aceita_criancas),
            paraBooleano(permite_fumar),
            paraBooleano(entrada_imediata)
        ]);

        let listaComodidades = [];

        if (comodidades) {
            try {
                listaComodidades = JSON.parse(comodidades);
            } catch {
                listaComodidades = [];
            }
        }

        for (const nome of listaComodidades) {
            await client.query(`
                INSERT INTO imoveis_comodidades (imovel_id, nome)
                VALUES ($1, $2)
                ON CONFLICT (imovel_id, nome) DO NOTHING
            `, [imovelId, nome]);
        }

        await salvarArquivos(client, imovelId, req.files);
        await client.query("COMMIT");

        return res.status(201).json({
            sucesso: true,
            mensagem: "Imóvel publicado com sucesso!",
            imovel_id: imovelId
        });
    } catch (erro) {
        await client.query("ROLLBACK");
        console.error("Erro ao criar imóvel:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro interno ao publicar imóvel."
        });
    } finally {
        client.release();
    }
}

async function exibirFoto(req, res) {
    try {
        const resultado = await db.query(
            "SELECT foto_url FROM imoveis_fotos WHERE id = $1",
            [req.params.fotoId]
        );

        const foto = resultado.rows[0];

        if (!foto) {
            return res.status(404).end();
        }

        const resposta = await s3.send(new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: obterChaveS3(foto.foto_url)
        }));

        if (resposta.ContentType) {
            res.setHeader("Content-Type", resposta.ContentType);
        }

        res.setHeader("Cache-Control", "public, max-age=3600");

        if (typeof resposta.Body?.pipe === "function") {
            resposta.Body.pipe(res);
            return;
        }

        const bytes = await resposta.Body.transformToByteArray();
        return res.send(Buffer.from(bytes));
    } catch (erro) {
        console.error("Erro ao exibir foto:", erro);
        return res.status(500).end();
    }
}

async function listarImoveis(req, res) {
    try {
        const resultado = await db.query(`
            SELECT
                i.id,
                i.usuario_id,
                i.titulo,
                i.descricao,
                i.tipo,
                i.finalidade,
                i.valor,
                i.cidade,
                i.bairro,
                i.endereco,
                i.numero,
                i.complemento,
                i.quartos,
                i.banheiros,
                i.vagas,
                i.area,
                i.status,
                i.criado_em,
                (
                    SELECT f.id
                    FROM imoveis_fotos f
                    WHERE f.imovel_id = i.id
                    ORDER BY f.ordem ASC
                    LIMIT 1
                ) AS foto_principal_id
            FROM imoveis i
            WHERE i.status = 'disponivel'
            ORDER BY i.criado_em DESC
        `);

        const imoveis = resultado.rows.map(imovel => ({
            ...imovel,
            foto_principal: urlFotoPublica(req, imovel.foto_principal_id)
        }));

        return res.status(200).json({
            sucesso: true,
            quantidade: imoveis.length,
            imoveis
        });
    } catch (erro) {
        console.error("Erro ao listar imóveis:", erro);

        return res.status(500).json({ sucesso: false, erro: "Erro ao buscar imóveis." });
    }
}

async function listarMeusImoveis(req, res) {
    try {
        const resultado = await db.query(`
            SELECT
                i.id,
                i.titulo,
                i.tipo,
                i.valor,
                i.cidade,
                i.bairro,
                i.status,
                i.criado_em,
                (
                    SELECT f.id
                    FROM imoveis_fotos f
                    WHERE f.imovel_id = i.id
                    ORDER BY f.ordem ASC
                    LIMIT 1
                ) AS foto_principal_id
            FROM imoveis i
            WHERE i.usuario_id = $1
            ORDER BY i.criado_em DESC
        `, [req.usuario.id]);

        const imoveis = resultado.rows.map(imovel => ({
            ...imovel,
            foto_principal: urlFotoPublica(req, imovel.foto_principal_id)
        }));

        return res.status(200).json({
            sucesso: true,
            quantidade: imoveis.length,
            imoveis
        });
    } catch (erro) {
        console.error("Erro ao listar imóveis do usuário:", erro);

        return res.status(500).json({ sucesso: false, erro: "Erro ao buscar seus imóveis." });
    }
}

async function buscarImovelPorId(req, res) {
    try {
        const resultado = await db.query(`
            SELECT
                i.*,
                u.nome AS nome_usuario,
                u.sobrenome AS sobrenome_usuario,
                v.condominio,
                v.iptu,
                v.seguro,
                v.financiamento,
                v.reserva_percentual,
                r.disponibilidade,
                r.contrato_minimo,
                r.regras_adicionais,
                r.aceita_animais,
                r.aceita_criancas,
                r.permite_fumar,
                r.entrada_imediata
            FROM imoveis i
            INNER JOIN usuarios u ON u.id = i.usuario_id
            LEFT JOIN imoveis_valores v ON v.imovel_id = i.id
            LEFT JOIN imoveis_regras r ON r.imovel_id = i.id
            WHERE i.id = $1
        `, [req.params.id]);

        const imovel = resultado.rows[0];

        if (!imovel) {
            return res.status(404).json({ sucesso: false, erro: "Imóvel não encontrado." });
        }

        const fotosResultado = await db.query(`
            SELECT id, ordem
            FROM imoveis_fotos
            WHERE imovel_id = $1
            ORDER BY ordem ASC
        `, [req.params.id]);

        const comodidadesResultado = await db.query(`
            SELECT nome
            FROM imoveis_comodidades
            WHERE imovel_id = $1
            ORDER BY nome ASC
        `, [req.params.id]);

        const fotos = fotosResultado.rows.map(foto => ({
            ...foto,
            foto_url: urlFotoPublica(req, foto.id)
        }));

        return res.status(200).json({
            sucesso: true,
            imovel: {
                ...imovel,
                fotos,
                comodidades: comodidadesResultado.rows.map(item => item.nome)
            }
        });
    } catch (erro) {
        console.error("Erro ao buscar imóvel:", erro);

        return res.status(500).json({ sucesso: false, erro: "Erro ao buscar imóvel." });
    }
}

async function excluirImovel(req, res) {
    const client = await db.connect();

    try {
        const resultadoImovel = await client.query(`
            SELECT id
            FROM imoveis
            WHERE id = $1 AND usuario_id = $2
        `, [req.params.id, req.usuario.id]);

        if (resultadoImovel.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para excluí-lo."
            });
        }

        const fotos = await client.query(
            "SELECT foto_url FROM imoveis_fotos WHERE imovel_id = $1",
            [req.params.id]
        );

        const documentos = await client.query(
            "SELECT arquivo_url FROM imoveis_documentos WHERE imovel_id = $1",
            [req.params.id]
        );

        await client.query("BEGIN");
        await client.query("DELETE FROM imoveis WHERE id = $1", [req.params.id]);
        await client.query("COMMIT");

        const arquivos = [
            ...fotos.rows.map(item => item.foto_url),
            ...documentos.rows.map(item => item.arquivo_url)
        ];

        await Promise.allSettled(arquivos.map(excluirArquivoS3));

        return res.status(200).json({
            sucesso: true,
            mensagem: "Imóvel excluído com sucesso."
        });
    } catch (erro) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Erro ao excluir imóvel:", erro);

        return res.status(500).json({ sucesso: false, erro: "Erro ao excluir imóvel." });
    } finally {
        client.release();
    }
}

module.exports = {
    criarImovel,
    exibirFoto,
    listarImoveis,
    listarMeusImoveis,
    buscarImovelPorId,
    excluirImovel
};