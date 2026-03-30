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
export async function findAll(transaction, { attributes, include, where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const companyUser = await db.CompanyUser.findAll({
      attributes,
      include,
      where,
      transaction: t
    })

    return companyUser?.map(x => x.toJSON())
  })
}