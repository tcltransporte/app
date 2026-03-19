import { Op } from 'sequelize'

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll({ db, transaction }, { attributes, include, where, limit, offset, order }) {

  const { rows, count } = await db.Solicitation.findAndCountAll({
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

  const solicitation = await db.Solicitation.findOne({ attributes, include, where, transaction })

  return solicitation?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {object} data
* @param {object} options
* @returns {Promise<object>}
*/
export async function create({ db, transaction }, data, options = {}) {

  const solicitation = await db.Solicitation.create(data, { ...options, transaction })

  return solicitation?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {

  const { products: updatedProducts, services: updatedServices, ...solicitationData } = data

  // 1. Update the parent solicitation record
  await db.Solicitation.update(solicitationData, { where, transaction })

  const solicitationId = where.id

  // 2. Sync Products
  if (updatedProducts) {
    const existingProducts = await db.SolicitationProduct.findAll({
      where: { solicitationId },
      transaction
    })
    const existingIds = existingProducts.map(p => p.id)
    const incomingIds = updatedProducts
      .filter(p => typeof p.id === 'number' && p.id < 1000000000000)
      .map(p => p.id)

    // Delete removed items
    const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
    if (toDelete.length > 0) {
      await db.SolicitationProduct.destroy({
        where: { id: { [Op.in]: toDelete }, solicitationId },
        transaction
      })
    }

    // Update or Create
    for (const prod of updatedProducts) {
      const { product, ...prodData } = prod
      if (typeof prod.id === 'number' && prod.id < 1000000000000) {
        await db.SolicitationProduct.update(prodData, {
          where: { id: prod.id, solicitationId },
          transaction
        })
      } else {
        const { id: tempId, ...createData } = prodData
        await db.SolicitationProduct.create({ ...createData, solicitationId }, { transaction })
      }
    }
  }

  // 3. Sync Services (Similar logic if service model exists, for now following same pattern)
  // if (updatedServices) { ... }
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
*/
export async function destroy({ db, transaction }, { where }) {

  await db.Solicitation.destroy({ where, transaction })

}

// --- Product/Item Operations ---

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findProductAll({ db, transaction }, { attributes, include, where, limit, offset, order }) {

  const { rows, count } = await db.SolicitationProduct.findAndCountAll({
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
export async function findProductOne({ db, transaction }, { attributes, include, where }) {

  const product = await db.SolicitationProduct.findOne({ attributes, include, where, transaction })

  return product?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {object} data
* @returns {Promise<object>}
*/
export async function createProduct({ db, transaction }, data) {

  const product = await db.SolicitationProduct.create(data, { transaction })

  return product?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function updateProduct({ db, transaction }, { where }, data) {

  await db.SolicitationProduct.update(data, { where, transaction })

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
*/
export async function destroyProduct({ db, transaction }, { where }) {

  await db.SolicitationProduct.destroy({ where, transaction })

}
