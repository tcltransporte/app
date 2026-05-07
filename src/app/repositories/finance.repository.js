import { Op } from 'sequelize'
import { AppContext } from '@/database'

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAll(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.FinanceTitle.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
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
    const title = await db.FinanceTitle.findOne({ attributes, include: [...(include || []), 'company'], where, transaction: t })
    return title?.toJSON()
  })
}

async function syncEntries(transaction, titleId, entries) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    if (entries) {
      const existingEntries = await db.FinanceEntry.findAll({
        attributes: ['id'],
        where: { titleId },
        transaction: t
      })
      const existingIds = existingEntries.map(i => i.id)
      const incomingIds = entries
        .filter(i => typeof i.id === 'number' && i.id < 1000000000000)
        .map(i => i.id)

      // Delete removed items
      const toDelete = existingIds.filter(eid => !incomingIds.includes(eid))
      if (toDelete.length > 0) {
        await db.FinanceEntry.destroy({
          where: { id: { [Op.in]: toDelete }, titleId },
          transaction: t
        })
      }

      // Update or Create
      for (const row of entries) {
        if (typeof row.id === 'number' && row.id < 1000000000000) {
          await db.FinanceEntry.update(row, {
            where: { id: row.id, titleId },
            transaction: t
          })
        } else {
          const { id: tempId, ...createData } = row
          await db.FinanceEntry.create({ ...createData, titleId }, { transaction: t })
        }
      }
    }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {object} data
* @param {object} options
* @returns {Promise<object>}
*/
export async function create(transaction, data, options = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { entries, ...titleData } = data

    const title = await db.FinanceTitle.create(titleData, { ...options, transaction: t })

    if (entries) {
      await syncEntries(t, title.id, entries)
    }

    return findOne(t, {
      where: { id: title.id },
      include: [{ association: 'entries' }]
    })
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ where? }} params
* @param {object} data
*/
export async function update(transaction, { where }, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { entries, ...titleData } = data

    await db.FinanceTitle.update(titleData, { where, transaction: t })

    const titleId = where.id || (await db.FinanceTitle.findOne({ where, transaction: t, attributes: ['id'] }))?.id

    if (titleId && entries) {
      await syncEntries(t, titleId, entries)
    }
  })
}

/**
* @param {import('sequelize').Transaction} transaction
* @param {{ attributes?, include?, where?, limit?, offset?, order? }} params
* @returns {Promise<{ rows: object[], count: number }>}
*/
export async function findAllEntries(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.FinanceEntry.findAndCountAll({
      attributes: {
        exclude: ['dueDate'],
        include: [
          [
            db.literal("CONVERT(varchar(10), [financeEntry].[data_vencimento], 23)"),
            'dueDate'
          ],
          [
            db.literal(`(SELECT COUNT(*) FROM movimentos_detalhe WHERE movimentos_detalhe.codigo_movimento = financeEntry.codigo_movimento)`),
            'installmentsCount'
          ],
          [
            db.literal(`(CASE
              WHEN [financeEntry].[codigo_pagamento] IS NULL THEN
                CASE
                  WHEN [financeEntry].[data_vencimento] IS NOT NULL
                    AND CONVERT(date, [financeEntry].[data_vencimento]) < CONVERT(date, SYSDATETIME()) THEN 'late'
                  ELSE 'open'
                END
              WHEN EXISTS (
                SELECT 1
                FROM [movimento_bancario] AS [mb]
                INNER JOIN [pagamentos_detalhe] AS [pd] ON [pd].[codigo_pagamento_detalhe] = [mb].[IDPagamentoDetalhe]
                WHERE [pd].[codigo_pagamento] = [financeEntry].[codigo_pagamento]
              )
              AND NOT EXISTS (
                SELECT 1
                FROM [movimento_bancario] AS [mb2]
                INNER JOIN [pagamentos_detalhe] AS [pd2] ON [pd2].[codigo_pagamento_detalhe] = [mb2].[IDPagamentoDetalhe]
                WHERE [pd2].[codigo_pagamento] = [financeEntry].[codigo_pagamento]
                  AND ISNULL([mb2].[boolConciliado], 0) = 0
              ) THEN 'paid'
              ELSE 'pending_recon'
            END)`),
            'displayStatus'
          ],
          [
            db.literal(`(
              SELECT TOP 1 CONVERT(varchar(10), [mb].[data_real], 23)
              FROM [movimento_bancario] AS [mb]
              INNER JOIN [pagamentos_detalhe] AS [pd] ON [pd].[codigo_pagamento_detalhe] = [mb].[IDPagamentoDetalhe]
              WHERE [pd].[codigo_pagamento] = [financeEntry].[codigo_pagamento]
              ORDER BY [mb].[data_real] DESC, [mb].[codigo_movimento_bancario] DESC
            )`),
            'paymentRealDate'
          ]
        ]
      },
      include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
  })
}

export async function findBillMovementIdsByInvoiceNumber(transaction, { companyId, invoiceNumber }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.BillCte.findAll({
      attributes: ['movementId'],
      where: {
        movementId: { [Op.ne]: null }
      },
      include: [
        {
          association: 'bill',
          required: true,
          where: {
            ...(companyId ? { companyId } : {}),
            invoiceNumber: { [Op.like]: `%${invoiceNumber}%` }
          },
          attributes: []
        }
      ],
      transaction: t
    })

    const ids = [...new Set(rows.map((row) => Number(row.movementId)).filter((id) => !Number.isNaN(id)))]
    return ids
  })
}

export async function findEntry(transaction, id) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const entry = await db.FinanceEntry.findOne({
      where: { id },
      attributes: {
        include: [
          [
            db.literal(`(SELECT COUNT(*) FROM movimentos_detalhe WHERE movimentos_detalhe.codigo_movimento = financeEntry.codigo_movimento)`),
            'installmentsCount'
          ]
        ]
      },
      include: [{
        association: 'title',
        include: [
          'partner',
          'accountPlan',
          'costCenter',
          { association: 'company', attributes: ['id', 'name', 'surname', 'companyBusinessId'] }
        ]
      }],
      transaction: t
    })
    return entry?.toJSON()
  })
}

export async function updateEntry(transaction, id, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    await db.FinanceEntry.update(data, { where: { id }, transaction: t })
    return findEntry(t, id)
  })
}

export async function findEntryPaymentHistory(transaction, id) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const entry = await db.FinanceEntry.findOne({
      where: { id },
      include: [
        {
          association: 'payment',
          include: [
            {
              association: 'entries',
              include: [
                {
                  association: 'title',
                  include: ['partner', 'accountPlan', 'costCenter']
                }
              ]
            },
            {
              association: 'paymentEntries',
              include: [
                { association: 'bankMovements', include: [{ association: 'bankAccount', include: ['bank'] }] },
                'paymentMethod'
              ]
            }
          ]
        }

      ],
      transaction: t
    })
    return entry?.toJSON()
  })
}

export async function findAllBankMovements(transaction, { attributes, include, where, limit, offset, order }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.BankMovement.findAndCountAll({
      attributes, include, where, limit, offset, order, transaction: t,
      distinct: true
    })

    return { rows: rows.map(r => r.toJSON()), count }
  })
}

export async function findBankAccount(transaction, { where, attributes, include }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.BankAccount.findOne({ where, attributes, include, transaction: t })
    return row?.toJSON()
  })
}

export async function findAllBankAccounts(transaction, { where, attributes, include, order } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const rows = await db.BankAccount.findAll({
      where,
      attributes,
      include,
      order: order || [['description', 'ASC']],
      transaction: t
    })
    return rows.map((row) => row.toJSON())
  })
}

export async function createBankMovement(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const result = await db.BankMovement.create(data, { transaction: t })
    return result.toJSON()
  })
}

export async function updateBankMovements(transaction, ids, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affectedCount] = await db.BankMovement.update(data, {
      where: { id: { [Op.in]: ids } },
      transaction: t
    })
    return affectedCount
  })
}


export async function findBankMovement(transaction, id, { include } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const movement = await db.BankMovement.findOne({
      where: { id },
      include,
      transaction: t
    })
    return movement?.toJSON()
  })
}

export async function findPayment(transaction, id, { include } = {}) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const payment = await db.Payment.findOne({
      where: { id },
      include,
      transaction: t
    })
    return payment?.toJSON()
  })
}

export async function findCashClosureByAccountAndDate(transaction, { bankAccountId, date }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const baseDate = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(baseDate.getTime())) return null

    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0)
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 0, 0, 0, 0)

    const row = await db.CashClosure.findOne({
      where: {
        bankAccountId,
        date: { [Op.gte]: start, [Op.lt]: end }
      },
      include: [
        { association: 'status', attributes: ['id', 'description'], required: false }
      ],
      transaction: t
    })

    return row?.toJSON() || null
  })
}

export async function findAllCashClosures(transaction, { where, include, order, limit, offset }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const { rows, count } = await db.CashClosure.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
      transaction: t,
      distinct: true
    })
    return { rows: rows.map((row) => row.toJSON()), count }
  })
}

export async function createCashClosure(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.CashClosure.create(data, { transaction: t })
    return row.toJSON()
  })
}

export async function updateCashClosure(transaction, { where }, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const [affectedCount] = await db.CashClosure.update(data, { where, transaction: t })
    return affectedCount
  })
}

export async function createCashClosureHistory(transaction, data) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const row = await db.CashClosureHistory.create(data, { transaction: t })
    return row.toJSON()
  })
}

/**
 * Desfaz a baixa ligada ao pagamento: remove movimento(s) de extrato gerados pela baixa,
 * detalhes e capa do pagamento, e libera a(s) parcela(s).
 */
export async function reversePaymentSettlement(transaction, paymentId) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const details = await db.PaymentEntry.findAll({
      where: { paymentId },
      attributes: ['id'],
      transaction: t
    })
    const detailIds = details.map((d) => d.id)
    if (detailIds.length) {
      await db.BankMovement.destroy({
        where: { paymentEntryId: { [Op.in]: detailIds } },
        transaction: t,
      })
    }
    await db.PaymentEntry.destroy({ where: { paymentId }, transaction: t })
    await db.FinanceEntry.update({ paymentId: null }, { where: { paymentId }, transaction: t })

    const payDeleted = await db.Payment.destroy({ where: { id: paymentId }, transaction: t })
    if (!payDeleted) {
      throw {
        code: 'NOT_FOUND',
        message: 'Pagamento já removido ou não encontrado',
      }
    }

    return { paymentId }
  })
}


