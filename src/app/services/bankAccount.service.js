"use server"

import { Op } from 'sequelize'
import { getSession } from "@/libs/session"

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ query?: string, limit?: number }} options
 */
export async function findAll(transaction, { query, limit = 50 } = {}) {
  const db = (await import("@/database")).instance || new (await import("@/database")).AppContext()
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

  const rows = await db.BankAccount.findAll({
    where,
    limit,
    order: [['description', 'ASC']],
    include: ['bank'],
    transaction
  })

  return rows.map(r => r.toJSON())
}
