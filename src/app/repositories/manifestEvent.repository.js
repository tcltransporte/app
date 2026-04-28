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
    const events = rows.map((r) => r.toJSON())
    const userIds = [...new Set(events.map((ev) => ev.userId).filter(Boolean))]

    let userNameById = new Map()
    if (userIds.length > 0) {
      const users = await db.User.findAll({
        where: { id: userIds },
        attributes: ['id', 'userName'],
        transaction: t,
      })
      userNameById = new Map(
        users.map((u) => {
          const json = u.toJSON ? u.toJSON() : u
          return [json.id, (json.userName || '').trim()]
        })
      )
    }

    return events.map((ev) => ({
      ...ev,
      userName: userNameById.get(ev.userId) || null,
    }))
  })
}
