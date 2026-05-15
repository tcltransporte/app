import { AppContext } from '@/database'

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
 */
export async function findAll(transaction, { attributes, include, where, limit, offset, order } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.ShipmentComposition.findAndCountAll({
      attributes,
      include,
      where,
      limit,
      offset,
      order,
      transaction: t,
      distinct: true
    })
    return { rows: rows.map((r) => r.toJSON()), count }
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, include?, where? }} params
 */
export async function findOne(transaction, { attributes, include, where } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.ShipmentComposition.findOne({ attributes, include, where, transaction: t })
    return item?.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data
 */
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.ShipmentComposition.create(data, { transaction: t })
    return item?.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ where? }} params
 * @param {object} data
 */
export async function update(transaction, { where }, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.ShipmentComposition.update(data, { where, transaction: t })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ where? }} params
 */
export async function destroy(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.ShipmentComposition.destroy({ where, transaction: t })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 */
export async function findAllCompositionTypes(transaction) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const items = await db.ShipmentCompositionType.findAll({
      order: [['description', 'ASC']],
      transaction: t
    })
    return items.map((i) => i.toJSON())
  })
}
