import { Op, fn, literal, where as sqlWhere } from 'sequelize'
import { AppContext } from '@/database'

/** Coluna física na tabela `nota` (alias Sequelize = `nota`). */
const NOTA_CHAVE_NF_COL = literal('[nota].[chaveNf]')

/**
 * Notas cuja `chaveNf` (normalizada só dígitos) coincide com uma das chaves informadas.
 * @param {import('sequelize').Transaction} transaction
 * @param {string[]} nfKeys chaves NF-e (44 dígitos)
 * @returns {Promise<{ id: number|string, nfKey: string|null }[]>}
 * Uma entrada por chave solicitada, na mesma ordem, omitindo chaves sem nota cadastrada.
 */
export async function findAllByNfKeys(transaction, nfKeys) {
  const digits = [
    ...new Set(
      (nfKeys || [])
        .map((k) => String(k || '').replace(/\D/g, ''))
        .filter((k) => k.length === 44)
    )
  ]
  if (digits.length === 0) return []

  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.Nota.findAll({
      attributes: ['id', 'nfKey'],
      where: {
        [Op.or]: digits.map((d) =>
          sqlWhere(
            fn(
              'REPLACE',
              fn(
                'REPLACE',
                fn(
                  'REPLACE',
                  fn('ISNULL', NOTA_CHAVE_NF_COL, literal("''")),
                  ' ',
                  ''
                ),
                '.',
                ''
              ),
              '-',
              ''
            ),
            d
          )
        )
      },
      transaction: t
    })

    const byNorm = new Map()
    for (const row of rows) {
      const j = row.toJSON()
      const k = String(j.nfKey || '').replace(/\D/g, '')
      if (k.length === 44 && !byNorm.has(k)) byNorm.set(k, j)
    }

    return digits.map((d) => byNorm.get(d)).filter(Boolean)
  })
}
