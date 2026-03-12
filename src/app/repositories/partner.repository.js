import { Op } from 'sequelize'

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll({ db, transaction }, { attributes, include, where, limit, offset, order }) {

  const { rows, count } = await db.Partner.findAndCountAll({
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

  const partner = await db.Partner.findOne({ attributes, include, where, transaction })

  return partner?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {object} data
* @returns {Promise<object>}
*/
export async function create({ db, transaction }, data) {

  const partner = await db.Partner.create(data, { transaction })

  return partner?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {

  await db.Partner.update(data, { where, transaction })

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
*/
export async function destroy({ db, transaction }, { where }) {

  await db.Partner.destroy({ where, transaction })

}
