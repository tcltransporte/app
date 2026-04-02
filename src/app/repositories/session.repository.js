import { AppContext } from '@/database'

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ 
*   attributes?: string[],
*   include?: import('sequelize').Includeable,
*   where?: object
* }} params
* 
* @returns {Promise<object|null>}
*/
export async function findOne(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const session = await db.Session.findOne({ attributes, include, where, transaction: t })
    const plain = session?.toJSON()
    return plain
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ 
*   attributes?: string[],
*   include?: import('sequelize').Includeable,
*   where?: object
* }} params
* 
* @returns {Promise<object[]>}
*/
export async function findAll(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const sessions = await db.Session.findAll({ attributes, include, where, transaction: t })
    return sessions.map(s => s.toJSON())
  })
}

/**
* @param {import('sequelize').Transaction} transaction
*
* @param {{
*   userId: string,
*   companyId: number,
*   lastAcess: Date,
*   expireIn: number | null
* }} data
*/
export async function create(transaction, { userId, companyId, lastAcess, expireIn }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const session = await db.Session.create({ userId, companyId, lastAcess, expireIn }, { transaction: t })
    const plain = session?.toJSON()
    return plain
  })
}

/**
* @param {import('sequelize').Transaction} transaction
*
* @param {{ where?: object }} params
* @param {object} data
*/
export async function update(transaction, { where }, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.Session.update(data, { where, transaction: t })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
*
* @param {{
*   where?: object
* }} params
*/
export async function destroy(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.Session.destroy({ where, transaction: t })
  })
}