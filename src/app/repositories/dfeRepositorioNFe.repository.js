import Sequelize, { Op, QueryTypes } from 'sequelize'
import { AppContext } from '@/database'

/**
 * IdStatus em DfeRepositorioNFe referencia DfeRepositorioStatus (FK). Usa o menor Id existente
 * ou `process.env.DFE_REPOSITORIO_NFE_DEFAULT_STATUS_ID`.
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<number>}
 */
export async function findDefaultRepositorioStatusId(transaction) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.query(
      'SELECT TOP (1) [Id] AS [id] FROM [dbo].[DfeRepositorioStatus] ORDER BY [Id] ASC',
      { transaction: t, type: QueryTypes.SELECT }
    )
    const list = Array.isArray(rows) ? rows : []
    const id = list[0]?.id
    if (id != null && id !== '') return Number(id)

    const fromEnv = Number(process.env.DFE_REPOSITORIO_NFE_DEFAULT_STATUS_ID)
    if (!Number.isNaN(fromEnv) && fromEnv > 0) return fromEnv

    throw new Error(
      'Defina linhas em DfeRepositorioStatus ou a variável DFE_REPOSITORIO_NFE_DEFAULT_STATUS_ID com um Id válido da tabela.'
    )
  })
}

/** Match SQL Server nchar(44) padding for IN (...) lookups. */
export function chNFeAsNchar44(digits) {
  const d = String(digits ?? '').replace(/\D/g, '').slice(0, 44)
  return d.padEnd(44, ' ')
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ where?, include?, limit?, offset?, order? }} params
 * @returns {Promise<{ rows: import('sequelize').Model[], count: number }>}
 */
export async function findAndCountAll(transaction, { where, include, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    return await db.DfeRepositorioNFe.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order,
      distinct: true,
      subQuery: false,
      transaction: t,
    })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.DfeRepositorioNFe.create(data, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ id: number|string, data: object }} params
 */
export async function updateById(transaction, { id, data }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affected] = await db.DfeRepositorioNFe.update(data, {
      where: { id },
      transaction: t,
    })
    return affected
  })
}

/**
 * Uma linha por empresa + chave de 44 dígitos (comparação exata em nchar ou normalizada por LTRIM/RTRIM).
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, chNFeDigits: string }} params
 * @returns {Promise<object|null>}
 */
export async function findOneByCompanyAndChNFe(transaction, { companyId, chNFeDigits }) {
  const db = new AppContext()
  const d44 = String(chNFeDigits ?? '').replace(/\D/g, '').slice(0, 44)
  if (d44.length !== 44) return null

  const padded = chNFeAsNchar44(d44)
  const chNorm = Sequelize.fn(
    'LEFT',
    Sequelize.fn('LTRIM', Sequelize.fn('RTRIM', Sequelize.cast(Sequelize.col('chNFe'), 'NVARCHAR(50)'))),
    44
  )

  return await db.withTransaction(transaction, async (t) => {
    const row = await db.DfeRepositorioNFe.findOne({
      where: {
        companyId,
        [Op.or]: [{ chNFe: padded }, Sequelize.where(chNorm, Op.eq, d44)],
      },
      transaction: t,
    })
    return row?.toJSON() ?? null
  })
}

/**
 * chNFe values as digit strings (typically 44 chars). Returns set of digits-only keys already in repo for the company.
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, chNFeDigits: string[] }} params
 * @returns {Promise<Set<string>>}
 */
export async function findExistingChNFeDigitsSet(transaction, { companyId, chNFeDigits }) {
  const db = new AppContext()
  const unique = [...new Set((chNFeDigits || []).map((c) => String(c || '').replace(/\D/g, '')).filter((c) => c.length > 0))]
  if (!unique.length) return new Set()

  const padded = unique.map(chNFeAsNchar44)

  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.DfeRepositorioNFe.findAll({
      where: { companyId, chNFe: { [Op.in]: padded } },
      attributes: ['chNFe'],
      transaction: t,
    })
    const set = new Set()
    for (const r of rows) {
      const raw = r.chNFe ?? r.get?.('chNFe')
      const d = String(raw ?? '').replace(/\D/g, '')
      if (d) set.add(d.slice(0, 44))
    }
    return set
  })
}

/** `DFeLoteDist.IdSchema` cujo XML (proc) deve abrir na grade de distribuição. */
export const DFE_LOTE_DIST_SCHEMA_ID_XML_VIEW = 3

function mapLastManifestEventForList(ev) {
  if (!ev) return null
  const o = ev?.toJSON ? ev.toJSON() : ev
  const code = o.manifestationCode ?? o.ManifestationCode
  if (code == null || code === '') return null
  return { manifestationCode: String(code) }
}

/**
 * Linha da grade; `id` = `IdLoteDistDFe` (lote) para manifestação / findOne do vínculo principal.
 * `xmlLoteDistId` = `DFeLoteDist.Id` com `IdSchema === {@link DFE_LOTE_DIST_SCHEMA_ID_XML_VIEW}` para `getDecodedDoc`.
 * @param {object} row modelo ou JSON `DfeRepositorioNFe`
 * @param {Map<number, { id: number, nsu: string|number }>} [xmlLoteByRepoId] `Id` do repositório → lote com schema de XML completo
 */
export function mapRepositorioRowToDistributionListItem(row, xmlLoteByRepoId) {
  const j = row?.toJSON ? row.toJSON() : row
  if (!j || j.id == null) return null
  const ch = String(j.chNFe ?? '').trim()
  const digits = ch.replace(/\D/g, '')
  const cnpjFromCh = digits.length >= 14 ? digits.slice(6, 14) : ''
  const cnpjStored = j.cnpj != null ? String(j.cnpj).replace(/\D/g, '').slice(0, 14) : ''
  const cnpj = cnpjStored || cnpjFromCh
  let vNF = ''
  if (j.valorNf != null && String(j.valorNf).trim() !== '') {
    const n = Number(j.valorNf)
    if (Number.isFinite(n)) vNF = String(n)
  }
  const xmlMeta = xmlLoteByRepoId?.get(Number(j.id))
  return {
    id: j.idLoteDistDFe,
    repositorioId: j.id,
    nsu: '',
    chNFe: digits.length >= 44 ? digits.slice(0, 44) : digits,
    idSchema: null,
    schemaInfo: null,
    numeroDoc: j.numeroDoc != null ? Number(j.numeroDoc) : 0,
    cnpj,
    xNome: j.emitente ?? '',
    vNF,
    dhEmi: j.dhEmi,
    lastManifestEventId: j.lastManifestEventId,
    lastManifestEvent: mapLastManifestEventForList(j.lastManifestEvent),
    docXml: null,
    xmlLoteDistId: xmlMeta?.id ?? null,
    xmlLoteNsu: xmlMeta?.nsu != null ? String(xmlMeta.nsu) : '',
  }
}

/**
 * Lista paginada: `DfeRepositorioNFe` + consulta a `DFeLoteDist` (`IdSchema` = {@link DFE_LOTE_DIST_SCHEMA_ID_XML_VIEW}) para abrir XML do proc.
 * Filtros: `chNFe`, `numeroDoc`, `cnpj`, `xNome` (emitente), `vNF` (igualdade em `valorNf`); período em `dhEmi` via `range`.
 * @param {import('sequelize').Transaction} transaction
 * @param {{ companyId: number|string, page?: number, limit?: number, filters?: object, range?: object, sortBy?: string, sortOrder?: string }} params
 */
export async function findAllDistributionList(transaction, params) {
  const {
    companyId,
    page = 1,
    limit = 50,
    filters = {},
    range = {},
    sortBy = 'dhEmi',
    sortOrder = 'ASC',
  } = params

  const offset = (page - 1) * limit
  const dir = String(sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

  const repoWhere = { companyId }
  const andParts = []

  if (range.start && range.end) {
    const field = range.field || 'dhEmi'
    if (field === 'dhEmi') {
      const start = new Date(`${range.start.split('T')[0]}T00:00:00`)
      const end = new Date(`${range.end.split('T')[0]}T23:59:59`)
      repoWhere.dhEmi = { [Op.between]: [start, end] }
    }
    /* `data` de sincronização é do lote (DFeLoteDist), não há coluna equivalente só em DfeRepositorioNFe — ignorar. */
  }

  const chDigits = filters.chNFe ? String(filters.chNFe).replace(/\D/g, '') : ''
  if (chDigits) {
    if (chDigits.length === 44) {
      andParts.push({ chNFe: chNFeAsNchar44(chDigits) })
    } else {
      andParts.push({ chNFe: { [Op.like]: `%${chDigits}%` } })
    }
  }

  const nDocRaw = filters.numeroDoc != null ? String(filters.numeroDoc).trim() : ''
  if (nDocRaw !== '') {
    const nDoc = parseInt(nDocRaw.replace(/\D/g, ''), 10)
    if (Number.isFinite(nDoc) && nDoc > 0) andParts.push({ numeroDoc: nDoc })
  }

  const cnpjDigits = filters.cnpj ? String(filters.cnpj).replace(/\D/g, '') : ''
  if (cnpjDigits) {
    andParts.push({
      [Op.or]: [
        { cnpj: { [Op.like]: `%${cnpjDigits}%` } },
        { chNFe: { [Op.like]: `%${cnpjDigits}%` } },
      ],
    })
  }

  const xNomeTrim = filters.xNome != null ? String(filters.xNome).trim() : ''
  if (xNomeTrim) {
    andParts.push({ emitente: { [Op.like]: `%${xNomeTrim}%` } })
  }

  const vRaw = filters.vNF != null ? String(filters.vNF).trim() : ''
  if (vRaw !== '') {
    const normalized = vRaw.includes(',')
      ? vRaw.replace(/\./g, '').replace(',', '.')
      : vRaw
    const vn = Number(normalized)
    if (Number.isFinite(vn)) andParts.push({ valorNf: { [Op.eq]: vn } })
  }

  if (andParts.length) {
    repoWhere[Op.and] = andParts
  }

  let order
  if (sortBy === 'dhEmi') order = [['dhEmi', dir]]
  else if (sortBy === 'chNFe') order = [['chNFe', dir]]
  else if (sortBy === 'nsu') order = [['idLoteDistDFe', dir]]
  else if (sortBy === 'idSchema' || sortBy === 'numeroDoc') order = [['numeroDoc', dir]]
  else if (sortBy === 'cnpj' || sortBy === 'xNome') order = [['chNFe', dir]]
  else if (sortBy === 'vNF') order = [['valorNf', dir]]
  else order = [['dhEmi', dir]]

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const result = await db.DfeRepositorioNFe.findAndCountAll({
      where: repoWhere,
      include: [
        {
          model: db.ManifestEvent,
          as: 'lastManifestEvent',
          required: false,
          attributes: ['id', 'manifestationCode'],
        },
      ],
      limit,
      offset,
      order,
      distinct: true,
      subQuery: false,
      transaction: t,
    })

    const rows = result.rows
    const repoIds = rows.map((r) => Number(r.get?.('id') ?? r.id)).filter((id) => Number.isFinite(id) && id > 0)

    /** @type {Map<number, { id: number, nsu: string|number }>} */
    const xmlLoteByRepoId = new Map()
    if (repoIds.length) {
      const lotes = await db.DFeLoteDist.findAll({
        where: {
          companyId,
          idDfeRepositorioNFe: { [Op.in]: repoIds },
          idSchema: DFE_LOTE_DIST_SCHEMA_ID_XML_VIEW,
        },
        attributes: ['id', 'nsu', 'idDfeRepositorioNFe'],
        transaction: t,
      })
      for (const L of lotes) {
        const json = L.toJSON ? L.toJSON() : L
        const rid = Number(json.idDfeRepositorioNFe)
        const lid = Number(json.id)
        if (!Number.isFinite(rid) || !Number.isFinite(lid)) continue
        const prev = xmlLoteByRepoId.get(rid)
        if (!prev || lid > prev.id) xmlLoteByRepoId.set(rid, { id: lid, nsu: json.nsu })
      }
    }

    const items = rows
      .map((r) => mapRepositorioRowToDistributionListItem(r, xmlLoteByRepoId))
      .filter(Boolean)

    return {
      items,
      total: result.count,
      page,
      limit,
      filters,
      range,
      sortBy,
      sortOrder,
    }
  })
}
