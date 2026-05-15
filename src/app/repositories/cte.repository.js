import { Op, QueryTypes } from 'sequelize'
import { AppContext } from '@/database'

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, where?, limit?, offset?, order?, include? }} params
 * @returns {Promise<{ rows: object[], count: number }>}
 */
export async function findAll(transaction, { attributes, where, limit, offset, order, include }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const opts = {
      attributes,
      where,
      limit,
      offset,
      order,
      transaction: t,
      distinct: true
    }
    if (include?.length) {
      opts.include = include
      opts.subQuery = false
    }
    const { rows, count } = await db.Cte.findAndCountAll(opts)

    return { rows: rows.map((row) => row.toJSON()), count }
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} companyBranchId
 * @param {string} ctKey
 * @returns {Promise<object|null>}
 */
export async function findOneByCtKey(transaction, companyBranchId, ctKey) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.Cte.findOne({
      where: { companyBranchId, ctKey },
      transaction: t
    })
    return row ? row.toJSON() : null
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} values Atributos do modelo `Cte`
 * @returns {Promise<object>}
 */
export async function create(transaction, values) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.Cte.create(values, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} id
 * @param {{ originCityId?: number|null, destinationCityId?: number|null }} partial só grava campos definidos e não nulos
 * @returns {Promise<number>} linhas afetadas
 */
export async function updateOrigemDestino(transaction, id, partial) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const data = /** @type {Record<string, number>} */ ({})
    if (partial.originCityId != null) data.originCityId = partial.originCityId
    if (partial.destinationCityId != null) data.destinationCityId = partial.destinationCityId
    if (!Object.keys(data).length) return 0
    const [n] = await db.Cte.update(data, { where: { id }, transaction: t })
    return n
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {Array<number|string>} loadIds
 * @returns {Promise<Map<number, number>>}
 */
export async function countByLoadIds(transaction, loadIds = []) {
  const ids = [...new Set(
    (loadIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  )]
  if (!ids.length) return new Map()

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const keys = ids.map((_, i) => `:id${i}`).join(', ')
    const replacements = Object.fromEntries(ids.map((v, i) => [`id${i}`, v]))

    const rows = await db.query(
      `SELECT [IDCarga] AS [loadId], COUNT(*) AS [ctesCount]
       FROM [dbo].[Ctes]
       WHERE [IDCarga] IN (${keys})
       GROUP BY [IDCarga]`,
      {
        replacements,
        transaction: t,
        type: QueryTypes.SELECT
      }
    )

    const map = new Map()
    for (const row of Array.isArray(rows) ? rows : []) {
      const loadId = Number(row.loadId)
      const count = Number(row.ctesCount)
      if (Number.isFinite(loadId) && loadId > 0) {
        map.set(loadId, Number.isFinite(count) ? count : 0)
      }
    }
    return map
  })
}

export async function findBatchWithXml(transaction, params = {}) {
  const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500)
  const offset = Math.max(Number(params.offset) || 0, 0)
  const companyBranchId = params.companyBranchId

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const where = {
      xml: { [Op.ne]: null }
    }
    if (companyBranchId != null && companyBranchId !== '') {
      where.companyBranchId = companyBranchId
    }
    const rows = await db.Cte.findAll({
      attributes: ['id', 'xml'],
      where,
      limit,
      offset,
      order: [['id', 'ASC']],
      transaction: t
    })
    return rows.map((r) => {
      const j = r.toJSON()
      return { id: j.id, xml: j.xml != null ? String(j.xml) : null }
    })
  })
}
