"use server"

import { Op } from 'sequelize'
import { getSession } from "@/libs/session"
import * as bankAccountRepository from "@/app/repositories/bankAccount.repository"
import { AppContext } from "@/database"

/**
 * @param {import('sequelize').Transaction} transaction
 * @param {{ query?: string, limit?: number }} options
 */
export async function findAll(transaction, { query, limit = 50 } = {}) {
  const session = await getSession()
  const db = new AppContext()

  return await db.withTransaction(transaction, async (t) => {
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

    const accounts = await bankAccountRepository.findAll(t, {
      where,
      limit,
      include: [{ association: 'bank', attributes: ['id', 'description', 'code'] }],
    })

    if (accounts.length === 0) return []

    // Calculate balances with MSSQL Fix
    const accountIds = accounts.map(a => a.id)
    const movements = await db.BankMovement.findAll({
      attributes: [
        [db.col('codigo_conta_bancaria'), 'bankAccountId'],
        [db.col('tipo_movimento_bancario'), 'typeId'],
        [db.fn('SUM', db.col('valor')), 'total']
      ],
      where: {
        bankAccountId: { [Op.in]: accountIds },
        isConciled: true
      },
      group: [db.col('codigo_conta_bancaria'), db.col('tipo_movimento_bancario')],
      transaction: t,
      raw: true
    })

    return accounts.map(acc => {
      const accMovements = movements.filter(m => m.bankAccountId === acc.id)
      const credits = Number(accMovements.find(m => m.typeId === 1)?.total) || 0
      const debits = Number(accMovements.find(m => m.typeId === 2)?.total) || 0

      return {
        ...acc,
        currentBalance: Number(acc.initialBalance) + credits - debits
      }
    })
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
