"use server"

import * as freightLetterRepository from "@/app/repositories/freightLetter.repository"
import { getSession } from "@/libs/session"

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, sortBy = 'effectiveDate', sortOrder = 'DESC' } = {}) {
  const session = await getSession()
  
  const where = {}

  if (filters.solicitationId) {
    where.solicitationId = filters.solicitationId
  }

  if (filters.tripId) {
    where.tripId = filters.tripId
  }

  const { rows, count } = await freightLetterRepository.findAll(transaction, {
    where,
    include: [
      { association: 'payee', attributes: ['name', 'surname'] },
      { association: 'componentType', attributes: ['description'] },
      { association: 'movement', attributes: ['id', 'documentNumber'] }
    ],
    limit,
    offset: (page - 1) * limit,
    order: [[sortBy, sortOrder]]
  })

  return {
    items: rows,
    total: count,
    page,
    limit,
    filters,
    sortBy,
    sortOrder
  }
}

export async function findOne(transaction, id) {
  const item = await freightLetterRepository.findOne(transaction, {
    where: { id },
    include: [
      { association: 'payee' },
      { association: 'componentType' },
      { association: 'movement' },
      { association: 'solicitation' }
    ]
  })

  if (!item) throw { code: "NOT_FOUND", message: "Carta Frete não encontrada" }

  return item
}

export async function create(transaction, data) {
  const payload = {
    ...data,
    isSynchronized: data.isSynchronized ?? false,
    effectiveDate: data.effectiveDate || new Date(),
    statusId: data.statusId || 1, // Default status
  }

  const result = await freightLetterRepository.create(transaction, payload)
  return await findOne(transaction, result.id)
}

export async function update(transaction, id, data) {
  const existing = await freightLetterRepository.findOne(transaction, {
    attributes: ['id'],
    where: { id }
  })

  if (!existing) throw { code: "NOT_FOUND", message: "Carta Frete não encontrada" }

  await freightLetterRepository.update(transaction, { where: { id } }, data)
  return await findOne(transaction, id)
}

export async function findAllComponentTypes(transaction) {
  return await freightLetterRepository.findAllComponentTypes(transaction)
}
