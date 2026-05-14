import { AppContext } from '@/database'

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ cteId: number|string, notaId: number|string }} params
 * @returns {Promise<{ row: object, inserted: boolean }>}
 */
export async function createIfNotExists(transaction, { cteId, notaId }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const existing = await db.CteNota.findOne({
      where: { cteId, notaId },
      transaction: t
    })
    if (existing) {
      return { row: existing.toJSON(), inserted: false }
    }
    const row = await db.CteNota.create({ cteId, notaId }, { transaction: t })
    return { row: row.toJSON(), inserted: true }
  })
}
