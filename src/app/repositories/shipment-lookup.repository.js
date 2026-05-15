import { QueryTypes } from 'sequelize'
import { AppContext } from '@/database'

async function safeSelect(transaction, sql, replacements = {}) {
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      const rows = await db.query(sql, {
        replacements,
        transaction: t,
        type: QueryTypes.SELECT
      })
      return Array.isArray(rows) ? rows : []
    })
  } catch {
    return []
  }
}

function mapIdDescription(rows) {
  return rows
    .map((row) => ({
      id: Number(row.id),
      description: String(row.description ?? row.Descricao ?? '').trim()
    }))
    .filter((row) => Number.isFinite(row.id) && row.description)
}

export async function findPaymentTypes(transaction) {
  const rows = await safeSelect(
    transaction,
    `SELECT [ID] AS [id], [Descricao] AS [description]
     FROM [dbo].[CteTipoPagamento]
     ORDER BY [Descricao]`
  )
  return mapIdDescription(rows)
}

export async function findServiceTypes(transaction) {
  const rows = await safeSelect(
    transaction,
    `SELECT [ID] AS [id], [Descricao] AS [description]
     FROM [dbo].[CteTipoServico]
     ORDER BY [Descricao]`
  )
  return mapIdDescription(rows)
}

export async function findServicePayerTypes(transaction) {
  const rows = await safeSelect(
    transaction,
    `SELECT [ID] AS [id], [Descricao] AS [description]
     FROM [dbo].[CteTipoTomador]
     ORDER BY [Descricao]`
  )
  return mapIdDescription(rows)
}

export async function findIcmsCalculationTypes(transaction) {
  const rows = await safeSelect(
    transaction,
    `SELECT [ID] AS [id], [Descricao] AS [description]
     FROM [dbo].[TipoCalculoIcms]
     ORDER BY [Descricao]`
  )
  if (rows.length) return mapIdDescription(rows)

  const fallback = await safeSelect(
    transaction,
    `SELECT [ID] AS [id], [Descricao] AS [description]
     FROM [dbo].[CteTipoCalculoIcms]
     ORDER BY [Descricao]`
  )
  return mapIdDescription(fallback)
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {string} search
 * @param {number} limit
 */
export async function searchNcm(transaction, search = '', limit = 40) {
  const term = String(search ?? '').trim()
  const safeLimit = Math.min(Math.max(Number(limit) || 40, 1), 100)

  const rows = await safeSelect(
    transaction,
    `SELECT TOP (${safeLimit})
        [IDNCM] AS [id],
        [Codigo] AS [code],
        [Descricao] AS [description]
     FROM [dbo].[NCM]
     WHERE (:term = '' OR [Codigo] LIKE :like OR [Descricao] LIKE :like)
     ORDER BY [Codigo]`,
    { term, like: term ? `%${term}%` : '%' }
  )

  return rows
    .map((row) => {
      const id = Number(row.id)
      const code = String(row.code ?? '').trim()
      const description = String(row.description ?? '').trim()
      const label = code && description ? `${code} - ${description}` : code || description
      return { id, code, description, label }
    })
    .filter((row) => Number.isFinite(row.id))
}

export async function findNcmById(transaction, id) {
  const n = Number(id)
  if (!Number.isFinite(n)) return null

  const rows = await safeSelect(
    transaction,
    `SELECT TOP (1)
        [IDNCM] AS [id],
        [Codigo] AS [code],
        [Descricao] AS [description]
     FROM [dbo].[NCM]
     WHERE [IDNCM] = :id`,
    { id: n }
  )

  const row = rows[0]
  if (!row) return null

  const code = String(row.code ?? '').trim()
  const description = String(row.description ?? '').trim()
  return {
    id: n,
    code,
    description,
    label: code && description ? `${code} - ${description}` : code || description
  }
}
