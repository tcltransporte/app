import { AppContext } from "@/database"

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.BankAccount.create(data, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ attributes?, include?, where? }} params
 * @returns {Promise<object[]>}
 */
export async function findAll(transaction, { attributes, include, where } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.BankAccount.findAll({
      attributes, include, where, transaction: t,
      order: [['description', 'ASC']]
    })
    return rows.map(r => r.toJSON())
  })
}
