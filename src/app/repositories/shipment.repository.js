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
    const { rows, count } = await db.Shipment.findAndCountAll(opts)
    return { rows: rows.map((row) => row.toJSON()), count }
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} id
 * @param {{ include? }} [options]
 */
export async function findOne(transaction, id, { include } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.Shipment.findOne({
      where: { id },
      include,
      transaction: t
    })
    return row ? row.toJSON() : null
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} values
 * @returns {Promise<object>}
 */
export async function create(transaction, values) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.Shipment.create(values, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} id
 * @param {object} values
 * @param {{ include? }} [options]
 */
export async function update(transaction, id, values, { include } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affected] = await db.Shipment.update(values, {
      where: { id },
      transaction: t
    })
    if (!affected) return null
    const row = await db.Shipment.findOne({
      where: { id },
      include,
      transaction: t
    })
    return row ? row.toJSON() : null
  })
}
