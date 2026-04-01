import { AppContext } from '@/database'

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
 */
export async function findAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.FreightLetter.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, include?, where? }} params
 */
export async function findOne(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.FreightLetter.findOne({ attributes, include, where, transaction: t })
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
    const item = await db.FreightLetter.create(data, { transaction: t })
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
    await db.FreightLetter.update(data, { where, transaction: t })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ where? }} params
 */
export async function destroy(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.FreightLetter.destroy({ where, transaction: t })
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 */
export async function findAllComponentTypes(transaction) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const items = await db.FreightLetterComponentType.findAll({ transaction: t })
    return items.map(i => i.toJSON())
  })
}
