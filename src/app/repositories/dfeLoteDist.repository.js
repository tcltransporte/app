import Sequelize, { Op } from 'sequelize'
import { AppContext } from '@/database'

/** `DocXml` no SQL Server costuma ser tipo XML — `LIKE` exige texto. */
function whereDocXmlTextLike(pattern) {
  return Sequelize.where(
    Sequelize.cast(Sequelize.col('docXml'), 'NVARCHAR(MAX)'),
    Op.like,
    pattern
  )
}

/** `DFeLoteDist.IdSchema` elegíveis para vínculo com `DfeRepositorioNFe` em `syncDistributionsToRepositorio`. */
export const DFE_LOTE_DIST_SCHEMA_IDS_FOR_REPOSITORIO_LINK = Object.freeze([2, 3, 5])

/**
 * SQL Server: chNFe (até 44 posições) extraída de coluna XML `DocXml` (alinhado a `docXmlChNFeCoalesceSql` no service).
 * @param {string} xmlCol ex. `L.[DocXml]`
 */
function sqlChNFe44FromDocXmlColumn(xmlCol) {
  const ns = 'declare namespace ns="http://www.portalfiscal.inf.br/nfe";'
  const protCh = `${xmlCol}.value('${ns} (/ns:nfeProc/ns:protNFe/ns:infProt/ns:chNFe/text())[1]', 'varchar(44)')`
  const resCh = `${xmlCol}.value('${ns} (/ns:resNFe/ns:chNFe/text())[1]', 'varchar(44)')`
  const nfeCh = `${xmlCol}.value('${ns} (/ns:NFe/ns:infNFe/ns:chNFe/text())[1]', 'varchar(44)')`
  const idAttr = `${xmlCol}.value('${ns} (/ns:NFe/ns:infNFe/@Id)[1]', 'varchar(50)')`
  const fromId = `CASE WHEN UPPER(LEFT(${idAttr}, 3)) = N'NFE' AND LEN(${idAttr}) >= 47 THEN SUBSTRING(${idAttr}, 4, 44) ELSE NULL END`
  return `NULLIF(LTRIM(RTRIM(COALESCE(${protCh}, ${resCh}, ${nfeCh}, ${fromId}))), '')`
}

/**
 * Preenche cnpj / xNome / vNF / dhEmi a partir do docXml na listagem.
 * Antes só rodava para idSchema === 2 (resumo resNFe no banco legado).
 * NF-e completa (procNFe / nfeProc) usa outro IdSchema em DFeLoteDistSchema.
 * @param {{ docXml?: string, idSchema?: number, schemaInfo?: { schema?: string } }} item
 */
function shouldEnrichDfeListColumns(item) {
  if (!item.docXml) return false
  const schema = (item.schemaInfo?.schema || '').toLowerCase()
  if (schema.includes('procnfe')) return true
  if (/<nfeProc\b/i.test(item.docXml)) return true
  if (schema.includes('resnfe')) return true
  if (item.idSchema === 2) return true
  return false
}

/**
 * Chave NF-e (44 dígitos) a partir do DocXml da distribuição (nfeProc/protNFe, resNFe, NFe, prefixos de namespace).
 * @param {string|null|undefined} docXml
 * @returns {string} dígitos da chave ou string vazia
 */
export function extractChNFeFromDocXml(docXml) {
  if (!docXml || typeof docXml !== 'string') return ''
  const s = docXml.replace(/^\uFEFF/, '').trim()
  if (!s) return ''

  const protCh = s.match(/<protNFe[^>]*>[\s\S]*?<chNFe>([^<]+)<\/chNFe>/i)
  if (protCh?.[1]) {
    const d = protCh[1].replace(/\D/g, '')
    if (d.length >= 44) return d.slice(0, 44)
  }

  const chTag = s.match(/<chNFe>([^<]+)<\/chNFe>/i)
  if (chTag?.[1]) {
    const d = chTag[1].trim().replace(/\D/g, '')
    if (d.length >= 44) return d.slice(0, 44)
  }

  const idAttr = s.match(/<(?:[\w.-]+:)?infNFe[^>]*\b[Ii][dD]\s*=\s*["']NFe(\d{44})["']/i)
  return idAttr?.[1] || ''
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.DFeLoteDist.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return {
      rows: rows.map(r => {
        const item = r.toJSON()
        if (item.docXml) {
          item.chNFe = extractChNFeFromDocXml(item.docXml)
        }
        if (shouldEnrichDfeListColumns(item)) {
          const cnpjMatch = item.docXml.match(/<CNPJ>([^<]+)<\/CNPJ>/)
          const xNomeMatch = item.docXml.match(/<xNome>([^<]+)<\/xNome>/)
          const vNFMatch = item.docXml.match(/<vNF>([^<]+)<\/vNF>/)
          const dhEmiMatch = item.docXml.match(/<dhEmi>([^<]+)<\/dhEmi>/)

          item.cnpj = cnpjMatch ? cnpjMatch[1] : ''
          item.xNome = xNomeMatch ? xNomeMatch[1] : ''
          item.vNF = vNFMatch ? vNFMatch[1] : ''
          item.dhEmi = dhEmiMatch ? dhEmiMatch[1] : ''
        }
        return item
      }),
      count
    }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where? }} params
* @returns {Promise<object|null>}
*/
export async function findOne(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.DFeLoteDist.findOne({ attributes, include, where, transaction: t })
    return item?.toJSON()
  })
}
/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where }} params
* @returns {Promise<string>}
*/
export async function findLastNSU(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.DFeLoteDist.findOne({
      where,
      order: [['nsu', 'DESC']],
      transaction: t
    })
    return item?.nsu || '0'
  })
}

/**
 * Lotes da empresa com `Nsu` na lista (ex.: upsert da distribuição).
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, nsus: string[] }} params `nsus` normalizados (só dígitos, como string)
 * @returns {Promise<object[]>}
 */
export async function findAllByCompanyAndNsus(transaction, { companyId, nsus }) {
  const list = Array.isArray(nsus) ? nsus.filter(Boolean) : []
  if (!list.length) return []

  /** Mesmo valor numérico que `DFeLoteDist.Nsu` (BIGINT), evitando mismatch string vs número no `IN`. */
  const numericNsus = []
  for (const s of list) {
    try {
      numericNsus.push(BigInt(String(s).replace(/\s/g, '')))
    } catch {
      /* ignora token inválido */
    }
  }
  if (!numericNsus.length) return []

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.DFeLoteDist.findAll({
      where: { companyId, nsu: { [Op.in]: numericNsus } },
      attributes: ['id', 'nsu'],
      transaction: t,
    })
    return rows.map((r) => r.toJSON())
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {any[]} data
* @returns {Promise<object[]>}
*/
export async function bulkCreate(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    return await db.DFeLoteDist.bulkCreate(data, { transaction: t })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data atributos do model `DFeLoteDist`
 * @returns {Promise<object>}
 */
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.DFeLoteDist.create(data, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} companyId
 * @returns {Promise<number>}
 */
export async function findMaxIdByCompany(transaction, companyId) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const v = await db.DFeLoteDist.max('id', { where: { companyId }, transaction: t })
    return v != null ? Number(v) : 0
  })
}

/**
 * Rows inserted after `afterId` for the same company (same transaction / no concurrent inserts).
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, afterId: number, limit: number }} params
 */
export async function findByCompanyIdGreaterThanId(transaction, { companyId, afterId, limit }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.DFeLoteDist.findAll({
      where: { companyId, id: { [Op.gt]: afterId } },
      order: [['id', 'ASC']],
      limit,
      transaction: t,
    })
    return rows.map((r) => r.toJSON())
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ id: number|string, data: object }} params
* @returns {Promise<number>}
*/
export async function updateById(transaction, { id, data }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affected] = await db.DFeLoteDist.update(data, {
      where: { id },
      transaction: t
    })
    return affected
  })
}

/**
 * Zera IdDfeRepositorioNFe nos outros lotes que apontavam para o mesmo repositório (ao repontar IdLoteDistDFe).
 * @param {import('sequelize').Transaction} transaction
 * @param {{ idDfeRepositorioNFe: number|string, keepLoteId: number|string }} params
 */
export async function clearIdDfeRepositorioNFeExceptLote(transaction, { idDfeRepositorioNFe, keepLoteId }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affected] = await db.DFeLoteDist.update(
      { idDfeRepositorioNFe: null },
      {
        where: {
          idDfeRepositorioNFe,
          id: { [Op.ne]: keepLoteId },
        },
        transaction: t,
      }
    )
    return affected
  })
}

/**
 * Lotes com `IdDfeRepositorioNFe` NULL e elegíveis ao repositório:
 * `IdSchema` em {@link DFE_LOTE_DIST_SCHEMA_IDS_FOR_REPOSITORIO_LINK}, **ou** `DocXml` típico de NF-e na distribuição
 * (`nfeProc` / `resNFe`), **ou** já existe `DfeRepositorioNFe` na mesma empresa com a mesma chNFe extraída do `DocXml`
 * (ex.: resumo + proc com schemas diferentes — um já criou o repositório, o outro ainda precisa da FK).
 * Ordenação: `Nsu` ascendente (mais antigo primeiro), desempate por `Id`.
 * Opcional: `DFE_DIST_REPOSITORIO_PENDING_CAP` limita quantos registros por execução (DocXml pode ser grande).
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, idSchemas?: number[] }} params
 */
export async function findAllPendingForRepositorioLink(transaction, { companyId, idSchemas = [...DFE_LOTE_DIST_SCHEMA_IDS_FOR_REPOSITORIO_LINK] }) {
  const db = new AppContext()
  const cap = Number(process.env.DFE_DIST_REPOSITORIO_PENDING_CAP)
  const limit = Number.isFinite(cap) && cap > 0 ? cap : undefined

  const chFromXml = sqlChNFe44FromDocXmlColumn('[dfeLoteDist].[DocXml]')
  const existsRepoForSameCh = Sequelize.literal(`EXISTS (
    SELECT 1
    FROM [dbo].[DfeRepositorioNFe] AS [R]
    WHERE [R].[IDEmpresaFilial] = [dfeLoteDist].[IDEmpresaFilial]
      AND LEN(LTRIM(RTRIM(COALESCE(${chFromXml}, N'')))) = 44
      AND LEFT(LTRIM(RTRIM(CAST([R].[chNFe] AS NVARCHAR(50)))), 44) = LEFT(LTRIM(RTRIM(COALESCE(${chFromXml}, N''))), 44)
  )`)

  return await db.withTransaction(transaction, async (t) => {
    const opts = {
      where: {
        companyId,
        idDfeRepositorioNFe: null,
        [Op.or]: [
          { idSchema: { [Op.in]: idSchemas } },
          whereDocXmlTextLike('%<nfeProc%'),
          whereDocXmlTextLike('%:nfeProc%'),
          whereDocXmlTextLike('%<resNFe%'),
          whereDocXmlTextLike('%:resNFe%'),
          existsRepoForSameCh,
        ],
      },
      order: [
        ['nsu', 'ASC'],
        ['id', 'ASC'],
      ],
      attributes: ['id', 'docXml', 'idDfeRepositorioNFe', 'companyId', 'idSchema'],
      transaction: t,
    }
    if (limit != null) opts.limit = limit

    const rows = await db.DFeLoteDist.findAll(opts)
    return rows.map((r) => r.toJSON())
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {string} schemaName
* @returns {Promise<number>}
*/
export async function findOrCreateSchema(transaction, schemaName) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [schema] = await db.DFeLoteDistSchema.findOrCreate({
      where: { schema: schemaName },
      defaults: { descricao: schemaName },
      transaction: t
    })
    return schema.id
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {string[]} schemaNames
 * @returns {Promise<object[]>}
 */
export async function findAllSchemas(transaction, schemaNames) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const list = await db.DFeLoteDistSchema.findAll({
      where: { schema: schemaNames },
      transaction: t
    })
    return list.map(i => i.toJSON())
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {any[]} data
 * @returns {Promise<object[]>}
 */
export async function bulkCreateSchemas(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const list = await db.DFeLoteDistSchema.bulkCreate(data, { transaction: t })
    return list.map(i => i.toJSON())
  })
}
