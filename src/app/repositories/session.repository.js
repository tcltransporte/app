/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ 
*   attributes?: string[],
*   include?: import('sequelize').Includeable,
*   where?: object
* }} params
* 
* @returns {Promise<object|null>}
*/
export async function findOne({ db, transaction }, { attributes, include, where }) {

  const session = await db.Session.findOne({ attributes, include, where, transaction })

  return session?.toJSON()

}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ 
*   attributes?: string[],
*   include?: import('sequelize').Includeable,
*   where?: object
* }} params
* 
* @returns {Promise<object[]>}
*/
export async function findAll({ db, transaction }, { attributes, include, where }) {

  const sessions = await db.Session.findAll({ attributes, include, where, transaction })

  return sessions.map(s => s.toJSON())

}

/**
* @param {{
*   db: import('@/database').AppContext,
*   transaction: import('sequelize').Transaction
* }} context
*
* @param {{
*   userId: string,
*   companyId: number,
*   lastAcess: Date,
*   expireIn: number | null
* }} data
*/
export async function create({ db, transaction }, { userId, companyId, lastAcess, expireIn }) {

  const session = await db.Session.create({ userId, companyId, lastAcess, expireIn }, { transaction })

  return session?.toJSON()

}

/**
* @param {{
*   db: import('@/database').AppContext,
*   transaction: import('sequelize').Transaction
* }} context
*
* @param {{ where?: object }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {

  await db.Session.update(data, { where, transaction })

}

/**
* @param {{
*   db: import('@/database').AppContext,
*   transaction: import('sequelize').Transaction
* }} context
*
 * @param {{
*   where?: object
* }} params
*/
export async function destroy({ db, transaction }, { where }) {

  await db.Session.destroy({ where, transaction })

}