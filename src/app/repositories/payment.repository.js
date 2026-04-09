import { AppContext } from "@/database"

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
      const entry = await db.FinanceEntry.findByPk(item.entryId, { transaction: t })
      if (!entry) continue

      const entryValue = Number(entry.installmentValue) || 0

      // Create a unique Payment (Capa) for this installment
      const payment = await db.Payment.create({
        date: commonData.date || new Date(),
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
            realDate: comp.realDate || commonData.date || new Date(),
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
