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
    const company = await db.Company.findOne({ attributes, include, where, transaction: t })
    return company?.toJSON()
  })
}