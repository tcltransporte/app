"use server"

import { Op } from 'sequelize'
import { getSession } from "@/libs/session"
import * as bankAccountRepository from "@/app/repositories/bankAccount.repository"

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ query?: string, limit?: number }} options
 */
export async function findAll(transaction, { query, limit = 50 } = {}) {
  const session = await getSession()

  const where = {
    isActive: true,
    companyId: session.company.id
  }

  if (query) {
    where[Op.or] = [
      { description: { [Op.like]: `%${query}%` } },
      { bankName: { [Op.like]: `%${query}%` } },
      { accountNumber: { [Op.like]: `%${query}%` } }
    ]
  }

  return await bankAccountRepository.findAll(transaction, {
    where,
    limit,
    include: ['bank'],
  })
}

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {object} data
 */
export async function create(transaction, data) {
  const session = await getSession()

  const finalData = {
    ...data,
    companyId: session.company.id,
    isActive: true
  }

  return await bankAccountRepository.create(transaction, finalData)
}
