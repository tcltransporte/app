import { Op } from 'sequelize'

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll({ db, transaction }, { attributes, include, where, limit, offset, order }) {
  const { rows, count } = await db.FinanceTitle.findAndCountAll({
    attributes, include, where, limit, offset, order, transaction,
    distinct: true
  })

  return { rows: rows.map(r => r.toJSON()), count }
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where? }} params
* @returns {Promise<object|null>}
*/
export async function findOne({ db, transaction }, { attributes, include, where }) {
  const title = await db.FinanceTitle.findOne({ attributes, include, where, transaction })

  return title?.toJSON()
}

async function syncEntries({ db, transaction }, titleId, entries) {
  if (entries) {
    const existingEntries = await db.FinanceEntry.findAll({
      where: { titleId },
      transaction
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
        transaction
      })
    }

    // Update or Create
    for (const row of entries) {
      if (typeof row.id === 'number' && row.id < 1000000000000) {
        await db.FinanceEntry.update(row, {
          where: { id: row.id, titleId },
          transaction
        })
      } else {
        const { id: tempId, ...createData } = row
        await db.FinanceEntry.create({ ...createData, titleId }, { transaction })
      }
    }
  }
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {object} data
* @param {object} options
* @returns {Promise<object>}
*/
export async function create({ db, transaction }, data, options = {}) {
  const { entries, ...titleData } = data

  const title = await db.FinanceTitle.create(titleData, { ...options, transaction })

  if (entries) {
    await syncEntries({ db, transaction }, title.id, entries)
  }

  return findOne({ db, transaction }, {
    where: { id: title.id },
    include: [{ association: 'entries' }]
  })
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {
  const { entries, ...titleData } = data

  await db.FinanceTitle.update(titleData, { where, transaction })

  const titleId = where.id || (await db.FinanceTitle.findOne({ where, transaction, attributes: ['id'] }))?.id

  if (titleId && entries) {
    await syncEntries({ db, transaction }, titleId, entries)
  }
}
