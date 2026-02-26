/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ 
*   attributes?: string[], 
*   where: object
* }} params
* 
* @returns {Promise<object|null>}
*/
export async function findOne({ db, transaction }, { attributes, where }) {

  const company = await db.User.findOne({ attributes, where, transaction })

  return company?.toJSON()

}