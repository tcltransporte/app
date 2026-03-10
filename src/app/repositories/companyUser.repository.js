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
export async function findAll({ db, transaction }, { attributes, include, where }) {

  const companyUser = await db.CompanyUser.findAll({
    attributes,
    include,
    where,
    transaction
  })

  return companyUser?.map(x => x.toJSON())

}

/*
export async function findOne({ db, transaction }, { attributes, where }) {

  const company = await db.Company.findOne({ attributes, where, transaction })

  return company?.toJSON()

}*/