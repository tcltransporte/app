import { AppContext } from "@/database"

function coerceDate(value) {
  if (value == null || value === '') return new Date()
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

/** data_pagamento = Data Pgto do primeiro detalhe com valor. */
function paymentDateFromComposition(composition) {
  if (!Array.isArray(composition) || composition.length === 0) return new Date()
  const candidate = composition.find((c) => Number(c.value) > 0) ?? composition[0]
  return coerceDate(candidate?.realDate)
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createPayment(transaction, { settlements, commonData }) {
  const db = new AppContext()
  return await db.withTransaction(transaction, async (t) => {
    const results = []

    for (const item of settlements) {
      const entry = await db.FinanceEntry.findByPk(item.entryId, { 
        attributes: ['id', 'installmentValue', 'installmentNumber'],
        transaction: t 
      })
      if (!entry) continue

      const entryValue = Number(entry.installmentValue) || 0

      // Create a unique Payment (Capa) for this installment
      const payment = await db.Payment.create({
        date: paymentDateFromComposition(item.composition),
        totalValue: entryValue
      }, { transaction: t })

      // Link entry to its new Payment
      await db.FinanceEntry.update(
        { paymentId: payment.id },
        { where: { id: entry.id }, transaction: t }
      )

      // Process the specific composition for this installment
      for (const comp of item.composition) {
        const value = Number(comp.value) || 0
        if (value <= 0) continue

        // Create PaymentEntry
        const paymentEntry = await db.PaymentEntry.create({
          paymentId: payment.id,
          paymentMethodId: comp.paymentMethodId,
          value: value,
          paymentMethodNumber: comp.paymentMethodNumber,
          systemDate: new Date()
        }, { transaction: t })

        // Create BankMovement
        if (comp.bankAccountId) {
          await db.BankMovement.create({
            bankAccountId: comp.bankAccountId,
            typeId: comp.typeId || (commonData.isReceivable ? 1 : 2),
            entryDate: new Date(),
            realDate: coerceDate(comp.realDate),
            value: value,
            documentNumber: comp.paymentMethodNumber || 0,
            description: comp.description || `Baixa Parcela #${entry.installmentNumber} - Pgto ${payment.id}`,
            nominal: commonData.nominal || '',
            paymentEntryId: paymentEntry.id,
            isReconciled: !!comp.isReconciled
          }, { transaction: t })
        }
      }
      results.push(payment.toJSON())
    }

    return results
  })
}
