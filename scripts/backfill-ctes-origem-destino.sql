/*
  SQL Server: preenche Ctes.Origem / Ctes.Destino a partir do Xml (tags cMunIni, cMunFim)
  e da tabela municipio (codigo_municipio_ibge -> codigo_municipio).

  - XPath com local-name() ignora prefixo de namespace (cte:, etc.).
  - Só altera Origem/Destino quando encontra linha em municipio (mantém valor atual se não achar).
  - Coluna Xml pode ser tipo XML ou texto: CAST(... AS XML) no APPLY; filtro de vazio usa CAST para NVARCHAR(MAX)
    (não use LTRIM/RTRIM direto em coluna XML — erro 8116).

  Uso: rode primeiro o SELECT de pré-visualização; depois o UPDATE dentro da transação.

  Escopo: apenas linhas com IdViagem = 23159.
*/

SET NOCOUNT ON;

/* -------- 1) Pré-visualização (opcional) -------- */
SELECT
  c.ID,
  c.[IdViagem],
  NULLIF(LTRIM(RTRIM(tags.ibge_ini)), '') AS cMunIni,
  NULLIF(LTRIM(RTRIM(tags.ibge_fim)), '') AS cMunFim,
  mo.codigo_municipio AS Origem_novo,
  md.codigo_municipio AS Destino_novo,
  c.Origem AS Origem_atual,
  c.Destino AS Destino_atual
FROM dbo.Ctes AS c
OUTER APPLY (
  SELECT CAST(c.[Xml] AS XML) AS doc
) AS xd
OUTER APPLY (
  SELECT
    NULLIF(LTRIM(RTRIM(xd.doc.value('(//*[local-name() = "cMunIni"])[1]', 'nvarchar(20)'))), '') AS ibge_ini,
    NULLIF(LTRIM(RTRIM(xd.doc.value('(//*[local-name() = "cMunFim"])[1]', 'nvarchar(20)'))), '') AS ibge_fim
  WHERE xd.doc IS NOT NULL
) AS tags
LEFT JOIN dbo.municipio AS mo
  ON NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(20), mo.codigo_municipio_ibge))), '') = tags.ibge_ini
LEFT JOIN dbo.municipio AS md
  ON NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(20), md.codigo_municipio_ibge))), '') = tags.ibge_fim
WHERE c.[Xml] IS NOT NULL
  AND LEN(CAST(c.[Xml] AS NVARCHAR(MAX))) > 0
  AND c.[IdViagem] = 23159
  AND (mo.codigo_municipio IS NOT NULL OR md.codigo_municipio IS NOT NULL);

/* -------- 2) UPDATE (confira o SELECT acima, depois COMMIT) -------- */
BEGIN TRANSACTION;

UPDATE c
SET
  [Origem] = COALESCE(mo.codigo_municipio, c.[Origem]),
  [Destino] = COALESCE(md.codigo_municipio, c.[Destino])
FROM dbo.Ctes AS c
OUTER APPLY (
  SELECT CAST(c.[Xml] AS XML) AS doc
) AS xd
OUTER APPLY (
  SELECT
    NULLIF(LTRIM(RTRIM(xd.doc.value('(//*[local-name() = "cMunIni"])[1]', 'nvarchar(20)'))), '') AS ibge_ini,
    NULLIF(LTRIM(RTRIM(xd.doc.value('(//*[local-name() = "cMunFim"])[1]', 'nvarchar(20)'))), '') AS ibge_fim
  WHERE xd.doc IS NOT NULL
) AS tags
LEFT JOIN dbo.municipio AS mo
  ON NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(20), mo.codigo_municipio_ibge))), '') = tags.ibge_ini
LEFT JOIN dbo.municipio AS md
  ON NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(20), md.codigo_municipio_ibge))), '') = tags.ibge_fim
WHERE c.[Xml] IS NOT NULL
  AND LEN(CAST(c.[Xml] AS NVARCHAR(MAX))) > 0
  AND c.[IdViagem] = 23159
  AND (mo.codigo_municipio IS NOT NULL OR md.codigo_municipio IS NOT NULL);

/* Verifique @@ROWCOUNT no SSMS; se estiver ok: */
-- COMMIT TRANSACTION;
/* Se algo estiver errado: */
-- ROLLBACK TRANSACTION;
