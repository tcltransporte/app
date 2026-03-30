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
    const { rows, count } = await db.Solicitation.findAndCountAll({
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
    const solicitation = await db.Solicitation.findOne({ attributes, include, where, transaction: t })
    return solicitation?.toJSON()
  })
}

async function syncAssociations(transaction, solicitationId, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { products: updatedProducts, services: updatedServices, payments: updatedPayments } = data

    // 1. Sync Products
    if (updatedProducts) {
      const existingProducts = await db.SolicitationProduct.findAll({
        where: { solicitationId },
        transaction: t
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
          transaction: t
        })
      }

      // Update or Create
      for (const prod of updatedProducts) {
        const { product, ...prodData } = prod
        if (typeof prod.id === 'number' && prod.id < 1000000000000) {
          await db.SolicitationProduct.update(prodData, {
            where: { id: prod.id, solicitationId },
            transaction: t
          })
        } else {
          const { id: tempId, ...createData } = prodData
          await db.SolicitationProduct.create({ ...createData, solicitationId }, { transaction: t })
        }
      }
    }

    // 2. Sync Services
    if (updatedServices) {
      const existingServices = await db.SolicitationService.findAll({
        where: { solicitationId },
        transaction: t
      })
      const existingIds = existingServices.map(s => s.id)
      const incomingIds = updatedServices
        .filter(s => typeof s.id === 'number' && s.id < 1000000000000)
        .map(s => s.id)

      // Delete removed items
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
      if (toDelete.length > 0) {
        await db.SolicitationService.destroy({
          where: { id: { [Op.in]: toDelete }, solicitationId },
          transaction: t
        })
      }

      // Update or Create
      for (const serv of updatedServices) {
        const { service, ...servData } = serv 
        if (typeof serv.id === 'number' && serv.id < 1000000000000) {
          await db.SolicitationService.update(servData, {
            where: { id: serv.id, solicitationId },
            transaction: t
          })
        } else {
          const { id: tempId, ...createData } = servData
          await db.SolicitationService.create({ ...createData, solicitationId }, { transaction: t })
        }
      }
    }

    // 3. Sync Payments (SolicitationFinance - Flat list)
    if (updatedPayments) {
      const incomingPayments = updatedPayments

      const existingPayments = await db.SolicitationFinance.findAll({
        where: { solicitationId },
        transaction: t
      })

      const existingIds = existingPayments.map(p => p.id)
      const incomingIds = incomingPayments
        .filter(p => typeof p.id === 'number' && p.id < 1000000000000)
        .map(p => p.id)

      // Delete removed
      const toDelete = existingIds.filter(id => !incomingIds.includes(id))
      if (toDelete.length > 0) {
        await db.SolicitationFinance.destroy({
          where: { id: { [Op.in]: toDelete } },
          transaction: t
        })
      }

      // Update or Create
      for (const item of incomingPayments) {
        const { id, isEdit, paymentId, ...paymentData } = item
        if (typeof id === 'number' && id < 1000000000000) {
          await db.SolicitationFinance.update(paymentData, {
            where: { id },
            transaction: t
          })
        } else {
          await db.SolicitationFinance.create({
            ...paymentData,
            solicitationId
          }, { transaction: t })
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
    if (!data.number || data.number === 0 || data.number === '0') {
      const currentMaxNumber = await db.Solicitation.max('number', {
        where: { typeId: data.typeId, companyId: data.companyId },
        transaction: t
      });
      data.number = (isNaN(currentMaxNumber) ? 0 : currentMaxNumber) + 1;
    }

    const { products, services, payments, ...solicitationData } = data

    const solicitation = await db.Solicitation.create(solicitationData, { ...options, transaction: t })

    await syncAssociations(t, solicitation.id, { products, services, payments })

    return solicitation?.toJSON()
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
    const { products, services, payments, ...solicitationData } = data

    // 1. Update the parent solicitation record
    await db.Solicitation.update(solicitationData, { where, transaction: t })

    const solicitationId = where.id

    await syncAssociations(t, solicitationId, { products, services, payments })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where? }} params
*/
export async function destroy(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.Solicitation.destroy({ where, transaction: t })
  })
}

// --- Product/Item Operations ---

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findProductAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.SolicitationProduct.findAndCountAll({
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
export async function findProductOne(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const product = await db.SolicitationProduct.findOne({ attributes, include, where, transaction: t })
    return product?.toJSON()
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {object} data
* @returns {Promise<object>}
*/
export async function createProduct(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const product = await db.SolicitationProduct.create(data, { transaction: t })
    return product?.toJSON()
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where? }} params
* @param {object} data
*/
export async function updateProduct(transaction, { where }, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.SolicitationProduct.update(data, { where, transaction: t })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where? }} params
*/
export async function destroyProduct(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.SolicitationProduct.destroy({ where, transaction: t })
  })
}
