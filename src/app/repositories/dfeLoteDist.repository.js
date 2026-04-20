import { AppContext } from '@/database'

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.DFeLoteDist.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return {
      rows: rows.map(r => {
        const item = r.toJSON()
        if (item.idSchema === 2 && item.docXml) {
          const cnpjMatch = item.docXml.match(/<CNPJ>([^<]+)<\/CNPJ>/)
          const xNomeMatch = item.docXml.match(/<xNome>([^<]+)<\/xNome>/)
          const vNFMatch = item.docXml.match(/<vNF>([^<]+)<\/vNF>/)
          const dhEmiMatch = item.docXml.match(/<dhEmi>([^<]+)<\/dhEmi>/)

          item.cnpj = cnpjMatch ? cnpjMatch[1] : ''
          item.xNome = xNomeMatch ? xNomeMatch[1] : ''
          item.vNF = vNFMatch ? vNFMatch[1] : ''
          item.dhEmi = dhEmiMatch ? dhEmiMatch[1] : ''
        }
        return item
      }),
      count
    }
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
    const item = await db.DFeLoteDist.findOne({ attributes, include, where, transaction: t })
    return item?.toJSON()
  })
}
/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where }} params
* @returns {Promise<string>}
*/
export async function findLastNSU(transaction, { where }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const item = await db.DFeLoteDist.findOne({
      where,
      order: [['nsu', 'DESC']],
      transaction: t
    })
    return item?.nsu || '0'
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {any[]} data
* @returns {Promise<object[]>}
*/
export async function bulkCreate(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    return await db.DFeLoteDist.bulkCreate(data, { transaction: t })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {string} schemaName
* @returns {Promise<number>}
*/
export async function findOrCreateSchema(transaction, schemaName) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [schema] = await db.DFeLoteDistSchema.findOrCreate({
      where: { schema: schemaName },
      defaults: { descricao: schemaName },
      transaction: t
    })
    return schema.id
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {string[]} schemaNames
 * @returns {Promise<object[]>}
 */
export async function findAllSchemas(transaction, schemaNames) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const list = await db.DFeLoteDistSchema.findAll({
      where: { schema: schemaNames },
      transaction: t
    })
    return list.map(i => i.toJSON())
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {any[]} data
 * @returns {Promise<object[]>}
 */
export async function bulkCreateSchemas(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const list = await db.DFeLoteDistSchema.bulkCreate(data, { transaction: t })
    return list.map(i => i.toJSON())
  })
}
