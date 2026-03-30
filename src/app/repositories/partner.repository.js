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
    const { rows, count } = await db.Partner.findAndCountAll({
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
    const partner = await db.Partner.findOne({ attributes, include, where, transaction: t })
    return partner?.toJSON()
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {object} data
* @returns {Promise<object>}
*/
export async function create(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const partner = await db.Partner.create(data, { transaction: t })
    return partner?.toJSON()
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
    await db.Partner.update(data, { where, transaction: t })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where? }} params
*/
export async function destroy(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.Partner.destroy({ where, transaction: t })
  })
}
