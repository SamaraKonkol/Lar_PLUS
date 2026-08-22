const { db } = require("../database/database");
const { uploadImagemS3 } = require("../utils/uploadS3");

function paraNumero(valor, padrao = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : padrao;
}

function paraBooleano(valor) {
    return valor === true || valor === "true" || valor === "1" || valor === "on" ? 1 : 0;
}

async function salvarArquivos(imovelId, files) {
    const fotos = files?.fotos || [];

    for (let i = 0; i < fotos.length; i++) {
        const fotoUrl = await uploadImagemS3(
            fotos[i],
            `imoveis/${imovelId}/fotos`
        );

        db.prepare(`
            INSERT INTO imoveis_fotos (
                imovel_id,
                foto_url,
                ordem
            )
            VALUES (?, ?, ?)
        `).run(imovelId, fotoUrl, i + 1);
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

        db.prepare(`
            INSERT INTO imoveis_documentos (
                imovel_id,
                tipo,
                arquivo_url,
                nome_original
            )
            VALUES (?, ?, ?, ?)
        `).run(
            imovelId,
            tipo,
            arquivoUrl,
            arquivo.originalname
        );
    }
}

async function criarImovel(req, res) {
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

        const inserirImovel = db.prepare(`
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const resultado = inserirImovel.run(
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
        );

        imovelId = Number(resultado.lastInsertRowid);

        db.prepare(`
            INSERT INTO imoveis_valores (
                imovel_id,
                condominio,
                iptu,
                seguro,
                financiamento,
                reserva_percentual
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            imovelId,
            paraNumero(condominio),
            paraNumero(iptu),
            paraNumero(seguro),
            paraNumero(financiamento),
            paraNumero(reserva_percentual, 10)
        );

        db.prepare(`
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            imovelId,
            disponibilidade || null,
            paraNumero(contrato_minimo, 12),
            regras_adicionais || null,
            paraBooleano(aceita_animais),
            paraBooleano(aceita_criancas),
            paraBooleano(permite_fumar),
            paraBooleano(entrada_imediata)
        );

        let listaComodidades = [];

        if (comodidades) {
            try {
                listaComodidades = JSON.parse(comodidades);
            } catch {
                listaComodidades = [];
            }
        }

        const inserirComodidade = db.prepare(`
            INSERT OR IGNORE INTO imoveis_comodidades (
                imovel_id,
                nome
            )
            VALUES (?, ?)
        `);

        for (const nome of listaComodidades) {
            inserirComodidade.run(imovelId, nome);
        }

        await salvarArquivos(imovelId, req.files);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Imóvel publicado com sucesso!",
            imovel_id: imovelId
        });
    } catch (erro) {
        console.error("Erro ao criar imóvel:", erro);

        if (imovelId) {
            db.prepare("DELETE FROM imoveis WHERE id = ?").run(imovelId);
        }

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
                imoveis.*,
                usuarios.nome AS nome_usuario,
                usuarios.sobrenome AS sobrenome_usuario,
                imoveis_valores.condominio,
                imoveis_valores.iptu,
                imoveis_valores.seguro,
                imoveis_valores.financiamento,
                imoveis_valores.reserva_percentual,
                imoveis_regras.disponibilidade,
                imoveis_regras.contrato_minimo,
                imoveis_regras.regras_adicionais,
                imoveis_regras.aceita_animais,
                imoveis_regras.aceita_criancas,
                imoveis_regras.permite_fumar,
                imoveis_regras.entrada_imediata
            FROM imoveis
            INNER JOIN usuarios
                ON usuarios.id = imoveis.usuario_id
            LEFT JOIN imoveis_valores
                ON imoveis_valores.imovel_id = imoveis.id
            LEFT JOIN imoveis_regras
                ON imoveis_regras.imovel_id = imoveis.id
            WHERE imoveis.id = ?
        `).get(id);

        if (!imovel) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado."
            });
        }

        const fotos = db.prepare(`
            SELECT id, foto_url, ordem
            FROM imoveis_fotos
            WHERE imovel_id = ?
            ORDER BY ordem ASC
        `).all(id);

        const comodidades = db.prepare(`
            SELECT nome
            FROM imoveis_comodidades
            WHERE imovel_id = ?
            ORDER BY nome ASC
        `).all(id).map(item => item.nome);

        return res.status(200).json({
            sucesso: true,
            imovel: {
                ...imovel,
                fotos,
                comodidades
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