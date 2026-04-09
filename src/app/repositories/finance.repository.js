import { Op } from 'sequelize'
import { AppContext } from '@/database'

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.FinanceTitle.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where? }} params
* @returns {Promise<object|null>}
*/
export async function findOne(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const title = await db.FinanceTitle.findOne({ attributes, include: [...(include || []), 'company'], where, transaction: t })
    return title?.toJSON()
  })
}

async function syncEntries(transaction, titleId, entries) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    if (entries) {
      const existingEntries = await db.FinanceEntry.findAll({
        where: { titleId },
        transaction: t
      })
      const existingIds = existingEntries.map(i => i.id)
      const incomingIds = entries
        .filter(i => typeof i.id === 'number' && i.id < 1000000000000)
        .map(i => i.id)

      // Delete removed items
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
      if (toDelete.length > 0) {
        await db.FinanceEntry.destroy({
          where: { id: { [Op.in]: toDelete }, titleId },
          transaction: t
        })
      }

      // Update or Create
      for (const row of entries) {
        if (typeof row.id === 'number' && row.id < 1000000000000) {
          await db.FinanceEntry.update(row, {
            where: { id: row.id, titleId },
            transaction: t
          })
        } else {
          const { id: tempId, ...createData } = row
          await db.FinanceEntry.create({ ...createData, titleId }, { transaction: t })
        }
      }
    }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {object} data
* @param {object} options
* @returns {Promise<object>}
*/
export async function create(transaction, data, options = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { entries, ...titleData } = data

    const title = await db.FinanceTitle.create(titleData, { ...options, transaction: t })

    if (entries) {
      await syncEntries(t, title.id, entries)
    }

    return findOne(t, {
      where: { id: title.id },
      include: [{ association: 'entries' }]
    })
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
    const { entries, ...titleData } = data

    await db.FinanceTitle.update(titleData, { where, transaction: t })

    const titleId = where.id || (await db.FinanceTitle.findOne({ where, transaction: t, attributes: ['id'] }))?.id

    if (titleId && entries) {
      await syncEntries(t, titleId, entries)
    }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAllEntries(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.FinanceEntry.findAndCountAll({
      attributes: {
        include: [
          [
            db.literal(`(SELECT COUNT(*) FROM movimentos_detalhe WHERE movimentos_detalhe.codigo_movimento = financeEntry.codigo_movimento)`),
            'installmentsCount'
          ]
        ]
      },
      include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
  })
}

export async function findEntry(transaction, id) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const entry = await db.FinanceEntry.findOne({
      where: { id },
      attributes: {
        include: [
          [
            db.literal(`(SELECT COUNT(*) FROM movimentos_detalhe WHERE movimentos_detalhe.codigo_movimento = financeEntry.codigo_movimento)`),
            'installmentsCount'
          ]
        ]
      },
      include: [{ 
        association: 'title', 
        include: [
          'partner', 
          'accountPlan', 
          'costCenter', 
          { association: 'company', attributes: ['id', 'name', 'surname'] }
        ] 
      }],
      transaction: t
    })
    return entry?.toJSON()
  })
}

export async function updateEntry(transaction, id, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.FinanceEntry.update(data, { where: { id }, transaction: t })
    return findEntry(t, id)
  })
}
