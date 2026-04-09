"use server"

import * as paymentRepository from "@/app/repositories/payment.repository"
import * as financeRepository from "@/app/repositories/finance.repository"
import { getSession } from "@/libs/session"

/**
 * Executes a payment for one or more installments.
 */
export async function executePayment(transaction, { settlements, commonData }) {
  const session = await getSession()
  
  // 1. Validate entries and company permissions
  const entryIds = settlements.map(s => s.entryId)
  const entries = await Promise.all(
    entryIds.map(id => financeRepository.findEntry(transaction, id))
  )

  if (entries.some(e => !e || e.title?.companyId !== session.company.id)) {
    throw { code: "NOT_FOUND", message: "Uma ou mais parcelas não foram encontradas ou não pertencem à sua empresa." }
  }

  if (entries.some(e => !!e.paymentId)) {
    throw { code: "ALREADY_PAID", message: "Uma ou mais parcelas já possuem pagamento registrado." }
  }

  // Determine global context
  const firstEntry = entries[0]
  const isReceivable = firstEntry.title?.type_operation === 2
  const partnerName = (firstEntry.title?.partner?.surname || firstEntry.title?.partner?.name || '').substring(0, 50)

  // 2. Map and prepare data for repository
  const mappedSettlements = settlements.map(settlement => {
    const entry = entries.find(e => e.id === settlement.entryId)
    const entryValue = Number(entry.installmentValue) || 0

    return {
      ...settlement,
      composition: settlement.composition.map(comp => ({
        ...comp,
        typeId: isReceivable ? 1 : 2, // 1: Entry/Receivable, 2: Exit/Payable
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
    db.PaymentMethod.findAll({ order: [['description', 'ASC']], transaction }),
    db.BankAccount.findAll({ 
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
