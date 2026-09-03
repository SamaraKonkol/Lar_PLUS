const { db } = require("../database/database");

function paraNumero(valor, padrao = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : padrao;
}

function paraBooleano(valor) {
    return valor === true || valor === "true" || valor === "1" || valor === "on";
}

function listaComodidades(valor) {
    if (!valor) {
        return [];
    }

    if (Array.isArray(valor)) {
        return valor;
    }

    try {
        const lista = JSON.parse(valor);
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

async function buscarImovelParaEdicao(req, res) {
    try {
        const resultado = await db.query(`
            SELECT
                i.*,
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
            LEFT JOIN imoveis_valores v ON v.imovel_id = i.id
            LEFT JOIN imoveis_regras r ON r.imovel_id = i.id
            WHERE i.id = $1 AND i.usuario_id = $2
        `, [req.params.id, req.usuario.id]);

        const imovel = resultado.rows[0];

        if (!imovel) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para editá-lo."
            });
        }

        const comodidades = await db.query(`
            SELECT nome
            FROM imoveis_comodidades
            WHERE imovel_id = $1
            ORDER BY nome ASC
        `, [req.params.id]);

        return res.status(200).json({
            sucesso: true,
            imovel: {
                ...imovel,
                comodidades: comodidades.rows.map(item => item.nome)
            }
        });
    } catch (erro) {
        console.error("Erro ao carregar imóvel para edição:", erro);
        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao carregar imóvel para edição."
        });
    }
}

async function atualizarImovel(req, res) {
    const client = await db.connect();

    try {
        const existente = await client.query(`
            SELECT id
            FROM imoveis
            WHERE id = $1 AND usuario_id = $2
        `, [req.params.id, req.usuario.id]);

        if (existente.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                erro: "Imóvel não encontrado ou você não possui permissão para editá-lo."
            });
        }

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

        await client.query(`
            UPDATE imoveis
            SET
                titulo = $1,
                descricao = $2,
                tipo = $3,
                finalidade = $4,
                valor = $5,
                cep = $6,
                estado = $7,
                cidade = $8,
                bairro = $9,
                endereco = $10,
                numero = $11,
                complemento = $12,
                ocultar_numero = $13,
                quartos = $14,
                suites = $15,
                banheiros = $16,
                vagas = $17,
                area = $18,
                area_construida = $19,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $20 AND usuario_id = $21
        `, [
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
            area_construida ? paraNumero(area_construida) : null,
            req.params.id,
            req.usuario.id
        ]);

        const valores = [
            paraNumero(condominio),
            paraNumero(iptu),
            paraNumero(seguro),
            paraNumero(financiamento),
            paraNumero(reserva_percentual, 10),
            req.params.id
        ];

        const atualizouValores = await client.query(`
            UPDATE imoveis_valores
            SET condominio = $1, iptu = $2, seguro = $3, financiamento = $4, reserva_percentual = $5
            WHERE imovel_id = $6
        `, valores);

        if (atualizouValores.rowCount === 0) {
            await client.query(`
                INSERT INTO imoveis_valores (condominio, iptu, seguro, financiamento, reserva_percentual, imovel_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, valores);
        }

        const regras = [
            disponibilidade || null,
            paraNumero(contrato_minimo, 12),
            regras_adicionais || null,
            paraBooleano(aceita_animais),
            paraBooleano(aceita_criancas),
            paraBooleano(permite_fumar),
            paraBooleano(entrada_imediata),
            req.params.id
        ];

        const atualizouRegras = await client.query(`
            UPDATE imoveis_regras
            SET
                disponibilidade = $1,
                contrato_minimo = $2,
                regras_adicionais = $3,
                aceita_animais = $4,
                aceita_criancas = $5,
                permite_fumar = $6,
                entrada_imediata = $7
            WHERE imovel_id = $8
        `, regras);

        if (atualizouRegras.rowCount === 0) {
            await client.query(`
                INSERT INTO imoveis_regras (
                    disponibilidade,
                    contrato_minimo,
                    regras_adicionais,
                    aceita_animais,
                    aceita_criancas,
                    permite_fumar,
                    entrada_imediata,
                    imovel_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, regras);
        }

        await client.query("DELETE FROM imoveis_comodidades WHERE imovel_id = $1", [req.params.id]);

        for (const nome of listaComodidades(comodidades)) {
            await client.query(`
                INSERT INTO imoveis_comodidades (imovel_id, nome)
                VALUES ($1, $2)
                ON CONFLICT (imovel_id, nome) DO NOTHING
            `, [req.params.id, nome]);
        }

        await client.query("COMMIT");

        return res.status(200).json({
            sucesso: true,
            mensagem: "Imóvel atualizado com sucesso."
        });
    } catch (erro) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Erro ao atualizar imóvel:", erro);
        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao atualizar imóvel."
        });
    } finally {
        client.release();
    }
}

module.exports = {
    buscarImovelParaEdicao,
    atualizarImovel
};
