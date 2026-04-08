"use server"

import * as financeRepository from "@/app/repositories/finance.repository"
import { getSession } from "@/libs/session"

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

  // Ensure title is included and its companyId matches the session
  const includeTitleIndex = params.include?.findIndex(inc => inc === 'title' || inc.association === 'title')
  let titleInclude = { association: 'title', where: { companyId: session.company.id } }

  if (includeTitleIndex !== undefined && includeTitleIndex > -1) {
    const existingTitleInclude = params.include[includeTitleIndex]
    if (typeof existingTitleInclude === 'string') {
      params.include[includeTitleIndex] = titleInclude
    } else {
      params.include[includeTitleIndex].where = { ...existingTitleInclude.where, companyId: session.company.id }
    }
  } else {
    params.include = [...(params.include || []), titleInclude]
  }

  return await financeRepository.findAllEntries(transaction, params)
}
