/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {object} data
* @param {object} options
* @returns {Promise<object>}
*/
export async function create({ db, transaction }, data, options = {}) {
  const document = await db.Document.create(data, { ...options, transaction })

  return document?.toJSON()
}

/**
* @param {{ db: import('@/database').AppContext, transaction: import('sequelize').Transaction }} context
* @param {{ where? }} params
* @param {object} data
*/
export async function update({ db, transaction }, { where }, data) {
  await db.Document.update(data, { where, transaction })
}
