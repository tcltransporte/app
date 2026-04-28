import { AppContext } from '@/database'

/**
* @param {import('sequelize').Transaction} transaction
* @param {object} data
* @returns {Promise<object>}
*/
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.ManifestEvent.create(data, { transaction: t })
    return row.toJSON()
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {number|string} dfeRepositorioNFeId
 * @returns {Promise<object[]>}
 */
export async function findAllByDfeRepositorioNFeId(transaction, dfeRepositorioNFeId) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.ManifestEvent.findAll({
      where: { dfeRepositorioNFeId },
      order: [['occurredAt', 'DESC']],
      transaction: t,
    })
    return rows.map((r) => r.toJSON())
  })
}
