import { AppContext } from "@/database"

function coerceDate(value) {
  if (value == null || value === '') return new Date()
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    // Parse date-only values in local timezone to avoid day shifting.
    return new Date(year, month - 1, day, 12, 0, 0, 0)
  }
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? new Date() : d
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
        attributes: ['id', 'installmentValue', 'installmentNumber', 'description'],
        transaction: t 
      })
      if (!entry) continue

      const entryValue = Number(entry.installmentValue) || 0

      // Create a unique Payment (Capa) for this installment
      const payment = await db.Payment.create({
        // "Data da baixa" must always reflect the current timestamp.
        date: new Date(),
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
          const entryDescription = String(entry.description || '').trim()
          await db.BankMovement.create({
            bankAccountId: comp.bankAccountId,
            typeId: comp.typeId || (commonData.isReceivable ? 1 : 2),
            entryDate: new Date(),
            realDate: coerceDate(comp.realDate),
            value: value,
            documentNumber: comp.paymentMethodNumber || 0,
            description: entryDescription || comp.description || `Baixa Parcela #${entry.installmentNumber} - Pgto ${payment.id}`,
            nominal: commonData.nominal || '',
            paymentEntryId: paymentEntry.id,
            isConciled: !!comp.isReconciled
          }, { transaction: t })
        }
      }
      results.push(payment.toJSON())
    }

    return results
  })
}
