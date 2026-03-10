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

  const company = await db.CompanyBusiness.findOne({ attributes, include, where, transaction })

  return company?.toJSON()

}