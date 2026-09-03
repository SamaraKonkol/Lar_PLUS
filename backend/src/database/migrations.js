const migrations = [
    {
        id: "001_indices_e_integridade_imoveis",
        executar: async client => {
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_imoveis_usuario
                ON imoveis (usuario_id);

                CREATE INDEX IF NOT EXISTS idx_imoveis_status_criado
                ON imoveis (status, criado_em DESC);

                CREATE INDEX IF NOT EXISTS idx_imoveis_fotos_imovel_ordem
                ON imoveis_fotos (imovel_id, ordem);

                CREATE INDEX IF NOT EXISTS idx_favoritos_usuario
                ON favoritos (usuario_id);

                UPDATE imoveis
                SET status = 'inativo'
                WHERE status NOT IN ('disponivel', 'inativo');

                UPDATE imoveis
                SET quartos = GREATEST(COALESCE(quartos, 0), 0),
                    suites = GREATEST(COALESCE(suites, 0), 0),
                    banheiros = GREATEST(COALESCE(banheiros, 0), 0),
                    vagas = GREATEST(COALESCE(vagas, 0), 0);

                UPDATE imoveis_valores
                SET condominio = GREATEST(COALESCE(condominio, 0), 0),
                    iptu = GREATEST(COALESCE(iptu, 0), 0),
                    seguro = GREATEST(COALESCE(seguro, 0), 0),
                    financiamento = GREATEST(COALESCE(financiamento, 0), 0),
                    reserva_percentual = LEAST(GREATEST(COALESCE(reserva_percentual, 10), 0), 100);
            `);

            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'chk_imoveis_status'
                    ) THEN
                        ALTER TABLE imoveis
                        ADD CONSTRAINT chk_imoveis_status
                        CHECK (status IN ('disponivel', 'inativo'));
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'chk_imoveis_valor_positivo'
                    ) THEN
                        ALTER TABLE imoveis
                        ADD CONSTRAINT chk_imoveis_valor_positivo
                        CHECK (valor > 0);
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'chk_imoveis_quantidades_nao_negativas'
                    ) THEN
                        ALTER TABLE imoveis
                        ADD CONSTRAINT chk_imoveis_quantidades_nao_negativas
                        CHECK (
                            quartos >= 0 AND
                            suites >= 0 AND
                            banheiros >= 0 AND
                            vagas >= 0
                        );
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'chk_imoveis_reserva_percentual'
                    ) THEN
                        ALTER TABLE imoveis_valores
                        ADD CONSTRAINT chk_imoveis_reserva_percentual
                        CHECK (reserva_percentual BETWEEN 0 AND 100);
                    END IF;
                END
                $$;
            `);
        }
    }
];

async function executarMigrations(pool) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id TEXT PRIMARY KEY,
            executada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    for (const migration of migrations) {
        const existente = await pool.query(
            "SELECT id FROM schema_migrations WHERE id = $1",
            [migration.id]
        );

        if (existente.rowCount > 0) {
            continue;
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            await migration.executar(client);
            await client.query(
                "INSERT INTO schema_migrations (id) VALUES ($1)",
                [migration.id]
            );
            await client.query("COMMIT");
            console.log(`Migration aplicada: ${migration.id}`);
        } catch (erro) {
            await client.query("ROLLBACK").catch(() => {});
            throw erro;
        } finally {
            client.release();
        }
    }
}

module.exports = {
    executarMigrations
};
