"use server"

import * as paymentRepository from "@/app/repositories/payment.repository"
import * as financeRepository from "@/app/repositories/finance.repository"

/** 1 = receber (entrada bancária), 2 = pagar (saída). Título primeiro; se nulo, plano de contas (`codigo_tipo_operacao`). */
function resolveFinanceOperationType(title) {
  if (!title) return NaN

  const fromTitle = title.operationType ?? title.type_operation
  if (fromTitle != null && fromTitle !== "") {
    const n = Number(fromTitle)
    if (!Number.isNaN(n)) return n
  }

  const fromPlan =
    title.accountPlan?.operationTypeId ?? title.accountPlan?.codigo_tipo_operacao
  if (fromPlan != null && fromPlan !== "") {
    const n = Number(fromPlan)
    if (!Number.isNaN(n)) return n
  }

  return NaN
}

/**
 * Executes a payment for one or more installments.
 */
export async function executePayment(transaction, { settlements, commonData }) {
  // 1. Validate entries
  const entryIds = settlements.map(s => s.entryId)
  const entries = await Promise.all(
    entryIds.map(id => financeRepository.findEntry(transaction, id))
  )

  if (entries.some(e => !e)) {
    throw { code: "NOT_FOUND", message: "Uma ou mais parcelas não foram encontradas." }
  }

  if (entries.some(e => !!e.paymentId)) {
    throw { code: "ALREADY_PAID", message: "Uma ou mais parcelas já possuem pagamento registrado." }
  }

  const firstEntry = entries[0]
  const isReceivable = Number(resolveFinanceOperationType(firstEntry.title)) === 1
  const partnerName = (firstEntry.title?.partner?.surname || firstEntry.title?.partner?.name || '').substring(0, 50)

  // 2. Map and prepare data for repository
  const mappedSettlements = settlements.map((settlement) => {
    const entry = entries.find((e) => e.id === settlement.entryId)
    const entryValue = Number(entry.installmentValue) || 0
    const entryIsReceivable = Number(resolveFinanceOperationType(entry.title)) === 1

    return {
      ...settlement,
      composition: settlement.composition.map((comp) => ({
        ...comp,
        typeId: entryIsReceivable ? 1 : 2, // 1 entrada (receber), 2 saída (pagar)
        nominal: partnerName,
        paymentMethodNumber: entry.title?.documentNumber,
        value: comp.value || entryValue // Default to entry value if not provided
      }))
    }
  })

  return await paymentRepository.createPayment(transaction, {
    settlements: mappedSettlements,
    commonData: {
      ...commonData,
      isReceivable,
      nominal: partnerName
    }
  })
}

export async function getPaymentFormData(transaction) {
  const db = (await import("@/database")).instance || new (await import("@/database")).AppContext()
  
  const [methods, accounts] = await Promise.all([
    db.PaymentMethod.findAll({ 
      attributes: ['id', 'description'],
      order: [['description', 'ASC']], 
      transaction 
    }),
    db.BankAccount.findAll({ 
      attributes: ['id', 'description', 'bankId'],
      where: { isActive: true }, 
      order: [['description', 'ASC']], 
      transaction 
    })
  ])

  return {
    methods: methods.map(m => m.toJSON()),
    accounts: accounts.map(a => a.toJSON())
  }
}
