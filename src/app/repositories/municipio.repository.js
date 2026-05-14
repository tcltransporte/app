import { QueryTypes } from 'sequelize'
import { AppContext } from '@/database'

/**
 * `codigo_municipio` interno usado em `Ctes.Origem` / `Ctes.Destino` (ex.: mesmo domínio que `empresa_filial.CodigoMunicipio`).
 * Tabela esperada: `[dbo].[municipio]` com `[codigo_municipio_ibge]` e `[codigo_municipio]`.
 *
 * @param {import('sequelize').Transaction} transaction
 * @param {string|number|null|undefined} codigoMunicipioIbge
 * @returns {Promise<number|null>}
 */
export async function findCodigoMunicipioByIbge(transaction, codigoMunicipioIbge) {
  const ibge = String(codigoMunicipioIbge ?? '').replace(/\D/g, '')
  if (!ibge) return null

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.query(
      `SELECT TOP (1) [codigo_municipio] AS [id]
       FROM [dbo].[municipio]
       WHERE [codigo_municipio_ibge] = :ibge`,
      {
        replacements: { ibge },
        transaction: t,
        type: QueryTypes.SELECT
      }
    )
    const list = Array.isArray(rows) ? rows : []
    const id = list[0]?.id
    if (id == null || id === '') return null
    const n = Number(id)
    return Number.isFinite(n) ? n : null
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {string[]} ibgeCodes só dígitos, valores únicos
 * @returns {Promise<Map<string, number>>} chave = código IBGE (string), valor = `codigo_municipio`
 */
export async function findCodigoMunicipioMapByIbgeList(transaction, ibgeCodes) {
  const list = [...new Set((ibgeCodes || []).map((c) => String(c).replace(/\D/g, '')).filter(Boolean))]
  if (!list.length) return new Map()

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const keys = list.map((_, i) => `:ib${i}`).join(', ')
    const replacements = Object.fromEntries(list.map((v, i) => [`ib${i}`, v]))
    const rows = await db.query(
      `SELECT [codigo_municipio_ibge] AS [ibge], [codigo_municipio] AS [id]
       FROM [dbo].[municipio]
       WHERE [codigo_municipio_ibge] IN (${keys})`,
      {
        replacements,
        transaction: t,
        type: QueryTypes.SELECT
      }
    )
    const map = new Map()
    for (const row of Array.isArray(rows) ? rows : []) {
      const k = String(row.ibge ?? '').replace(/\D/g, '')
      const id = row.id
      if (!k || id == null || id === '') continue
      const n = Number(id)
      if (Number.isFinite(n)) map.set(k, n)
    }
    return map
  })
}
