import { Op } from 'sequelize'
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
 * @param {{ limit?: number, offset?: number, companyBranchId?: number|string }} params
 * @returns {Promise<{ id: number, xml: string|null }[]>}
 */
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
