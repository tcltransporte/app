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
    include: [{ association: 'entries' }, { association: 'partner' }]
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
      { association: 'accountPlan', required: false }
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
