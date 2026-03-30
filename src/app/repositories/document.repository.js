import { Op } from 'sequelize'

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll({ db, transaction }, { attributes, include, where, limit, offset, order }) {
  const { rows, count } = await db.Document.findAndCountAll({
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
  const document = await db.Document.findOne({ attributes, include, where, transaction })

  return document?.toJSON()
}

async function syncAssociations({ db, transaction }, documentId, data) {
  const { items, services } = data

  // 1. Sync Products (items)
  if (items) {
    const existingItems = await db.DocumentProduct.findAll({
      where: { documentId },
      transaction
    })
    const existingIds = existingItems.map(i => i.id)
    const incomingIds = items
      .filter(i => typeof i.id === 'number' && i.id < 1000000000000)
      .map(i => i.id)

    // Delete removed items
    const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
    if (toDelete.length > 0) {
      await db.DocumentProduct.destroy({
        where: { id: { [Op.in]: toDelete }, documentId },
        transaction
      })
    }

    // Update or Create
    for (const row of items) {
      const { product, ...rowData } = row
      if (typeof row.id === 'number' && row.id < 1000000000000) {
        await db.DocumentProduct.update(rowData, {
          where: { id: row.id, documentId },
          transaction
        })
      } else {
        const { id: tempId, ...createData } = rowData
        await db.DocumentProduct.create({ ...createData, documentId }, { transaction })
      }
    }
  }

  // 2. Sync Services
  if (services) {
    const existingServices = await db.DocumentService.findAll({
      where: { documentId },
      transaction
    })
    const existingIds = existingServices.map(s => s.id)
    const incomingIds = services
      .filter(s => typeof s.id === 'number' && s.id < 1000000000000)
      .map(s => s.id)

    // Delete removed items
    const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
    if (toDelete.length > 0) {
      await db.DocumentService.destroy({
        where: { id: { [Op.in]: toDelete }, documentId },
        transaction
      })
    }

    // Update or Create
    for (const row of services) {
      const { service, ...rowData } = row
      if (typeof row.id === 'number' && row.id < 1000000000000) {
        await db.DocumentService.update(rowData, {
          where: { id: row.id, documentId },
          transaction
        })
      } else {
        const { id: tempId, ...createData } = rowData
        await db.DocumentService.create({ ...createData, documentId }, { transaction })
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
  const { items, services, ...documentData } = data

  const document = await db.Document.create(documentData, { ...options, transaction })

  await syncAssociations({ db, transaction }, document.id, { items, services })

  return document?.toJSON()
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {
  const { items, services, ...documentData } = data

  await db.Document.update(documentData, { where, transaction })

  const documentId = where.id || (await db.Document.findOne({ where, transaction, attributes: ['id'] }))?.id

  if (documentId) {
    await syncAssociations({ db, transaction }, documentId, { items, services })
  }
}
