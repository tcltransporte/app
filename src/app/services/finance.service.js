"use server"

import * as financeRepository from "@/app/repositories/finance.repository"
import { getSession } from "@/libs/session"
import { Op } from 'sequelize'

export async function findAll(transaction, params = {}) {
  const session = await getSession()

  const where = {
    ...params.where,
    companyId: session.company.id
  }

  const result = await financeRepository.findAll(transaction, { ...params, where })
  return result
}

export async function findOne(transaction, id) {
  const session = await getSession()

  const result = await financeRepository.findOne(transaction, {
    where: { id, companyId: session.company.id },
    include: [
      { association: 'entries' },
      { association: 'partner' },
      { association: 'accountPlan' },
      { association: 'costCenter' },
      { association: 'company', attributes: ['id', 'name', 'surname'] }
    ]
  })

  if (!result) {
    throw { code: "NOT_FOUND", message: "Título financeiro não encontrado" }
  }

  return result
}

export async function create(transaction, data) {
  const session = await getSession()

  const result = await financeRepository.create(transaction, {
    ...data,
    companyId: session.company.id
  })

  return result
}

export async function update(transaction, id, data) {
  const session = await getSession()

  await financeRepository.update(transaction, {
    where: { id, companyId: session.company.id }
  }, data)

  const result = await findOne(transaction, id)
  return result
}

export async function findAllEntries(transaction, params = {}) {
  const session = await getSession()

  const titleInclude = {
    association: 'title',
    where: { companyId: session.company.id },
    include: [
      { association: 'partner' },
      { association: 'accountPlan', required: false },
      { association: 'costCenter', required: false },
      { association: 'company', required: false, attributes: ['id', 'name', 'surname'] }
    ]
  }

  if (params.operationType) {
    params.where = {
      ...params.where,
      [Op.or]: [
        { '$title.type_operation$': params.operationType },
        {
          '$title.type_operation$': null,
          '$title.accountPlan.codigo_tipo_operacao$': params.operationType
        }
      ]
    }
    delete params.operationType
  }

  params.include = [...(params.include || []), titleInclude]

  if (params.range) {
    const { start, end, field = 'dueDate' } = params.range
    if (start && end) {
      params.where = {
        ...params.where,
        [field]: { [Op.between]: [start, end] }
      }
    }
    delete params.range
  }

  return await financeRepository.findAllEntries(transaction, params)
}

export async function findEntry(transaction, id) {
  const session = await getSession()
  const entry = await financeRepository.findEntry(transaction, id)
  if (!entry || entry.title?.companyId !== session.company.id) {
    throw { code: "NOT_FOUND", message: "Parcela financeira não encontrada" }
  }
  return entry
}

export async function updateEntry(transaction, id, data) {
  await findEntry(transaction, id) // Validate existence and company permissions first
  
  // Prevent updating security fields if present in data
  const { id: _id, titleId: _titleId, ...safeData } = data

  return await financeRepository.updateEntry(transaction, id, safeData)
}

export async function findEntryPaymentHistory(transaction, id) {
  const session = await getSession()
  const entry = await financeRepository.findEntryPaymentHistory(transaction, id)
  
  // Security check: ensure the entry belongs to a title that belongs to the user's company
  // Note: we might need to fetch the title first if findEntryPaymentHistory doesn't include it.
  // In our case, I'll rely on the existing findEntry for validation if needed, or just fetch title here.
  
  const validationEntry = await financeRepository.findEntry(transaction, id)
  if (!validationEntry || validationEntry.title?.companyId !== session.company.id) {
    throw { code: "NOT_FOUND", message: "Parcela financeira não encontrada" }
  }
  
  return entry
}

export async function findAllBankMovements(transaction, params = {}) {
  const session = await getSession()
  const { page = 1, limit = 50, sortBy = 'realDate', sortOrder = 'DESC' } = params
  const offset = (page - 1) * limit

  const where = {
    ...params.where
  }

  const include = [
    { 
      association: 'bankAccount', 
      where: { companyId: session.company.id },
      required: true 
    }
  ]

  if (params.range) {
    const { start, end, field = 'realDate' } = params.range
    if (start && end) {
      const s = new Date(start)
      s.setHours(0, 0, 0, 0)
      const e = new Date(end)
      e.setHours(23, 59, 59, 999)
      where[field] = { [Op.between]: [s, e] }
    }
  }

  return await financeRepository.findAllBankMovements(transaction, {
    ...params,
    where,
    include,
    limit,
    offset,
    order: [[sortBy, sortOrder]]
  })
}

export async function createBankMovement(transaction, data) {
  const session = await getSession()

  // Business logic: bank account MUST belong to company
  const account = await financeRepository.findBankAccount(transaction, {
    where: { id: data.bankAccountId, companyId: session.company.id }
  })

  if (!account) {
    throw { code: "INVALID_ACCOUNT", message: "Conta bancária inválida ou não pertence à empresa" }
  }

  const finalData = {
    ...data,
    entryDate: new Date(), // Data de lançamento é sempre agora
    realDate: data.realDate || new Date(), // Fallback para hoje se não fornecido
    isReconciled: false
  }

  return await financeRepository.createBankMovement(transaction, finalData)
}

export async function findBankBalances(transaction) {
  const session = await getSession()
  return await financeRepository.findBankBalances(transaction, session.company.id)
}
