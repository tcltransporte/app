/*
  Atualiza movimento_bancario.descricao com a descricao do movimentos_detalhe
  vinculado a baixa do título.

  Cadeia de vínculo:
    movimento_bancario.IDPagamentoDetalhe -> pagamentos_detalhe.codigo_pagamento
      -> movimentos_detalhe.codigo_pagamento

  Filtra apenas movimento_bancario cuja descricao começa com "Baixa" (LIKE N'Baixa%').

  SQL Server.
*/

-- Opcional: descomente para restringir a títulos que tenham vínculo em fatura_cte.
-- DECLARE @somente_cte BIT = 1;

/* Pré-visualização (execute antes do UPDATE)
SELECT DISTINCT
    mb.codigo_movimento_bancario,
    mb.descricao AS descricao_atual,
    md.Descricao AS descricao_movimento_detalhe,
    md.Descricao AS nova_descricao
FROM movimento_bancario mb
INNER JOIN pagamentos_detalhe pd ON pd.codigo_pagamento_detalhe = mb.IDPagamentoDetalhe
INNER JOIN movimentos_detalhe md ON md.codigo_pagamento = pd.codigo_pagamento
WHERE mb.IDPagamentoDetalhe IS NOT NULL
  AND md.codigo_pagamento IS NOT NULL
  AND mb.descricao LIKE N'Baixa%';
  -- AND (@somente_cte IS NULL OR @somente_cte = 0 OR EXISTS (
  --   SELECT 1 FROM fatura_cte fc
  --   WHERE fc.IDMovimentoDetalhe = md.codigo_movimento_detalhe
  -- ))
*/

BEGIN TRAN;

WITH ranked AS (
    SELECT
        mb.codigo_movimento_bancario AS id_mb,
        md.Descricao AS descricao_movimento_detalhe,
        ROW_NUMBER() OVER (
            PARTITION BY mb.codigo_movimento_bancario
            ORDER BY md.codigo_movimento_detalhe
        ) AS rn
    FROM movimento_bancario mb
    INNER JOIN pagamentos_detalhe pd ON pd.codigo_pagamento_detalhe = mb.IDPagamentoDetalhe
    INNER JOIN movimentos_detalhe md ON md.codigo_pagamento = pd.codigo_pagamento
    WHERE mb.IDPagamentoDetalhe IS NOT NULL
      AND md.codigo_pagamento IS NOT NULL
      AND mb.descricao LIKE N'Baixa%'
      /*
      Opcional — só registros relacionados a CT-e na fatura:
      AND EXISTS (
          SELECT 1
          FROM fatura_cte fc
          WHERE fc.IDMovimentoDetalhe = md.codigo_movimento_detalhe
      )
      */
)
UPDATE mb
SET mb.descricao = r.descricao_movimento_detalhe
FROM movimento_bancario mb
INNER JOIN ranked r ON r.id_mb = mb.codigo_movimento_bancario AND r.rn = 1;

/*
  Confira linhas afetadas; se estiver correto:
  COMMIT;
  Caso contrário:
*/
ROLLBACK;
-- ALTERE para COMMIT TRAN; após validar os dados em ambiente seguro.
