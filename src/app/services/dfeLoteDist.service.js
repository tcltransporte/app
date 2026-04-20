"use server"

import { Op } from 'sequelize'
import * as dfeLoteDistRepository from "@/app/repositories/dfeLoteDist.repository"
import { getSession } from "@/libs/session"

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'id', sortOrder = 'DESC' }) {
  const session = await getSession()
  const offset = (page - 1) * limit

  const where = {
    companyId: session.company.id
  }

  if (filters.nsu) {
    where.nsu = filters.nsu
  }

  if (filters.idSchema) {
    where.idSchema = filters.idSchema
  }

  if (filters.isUnPack !== undefined && filters.isUnPack !== null && filters.isUnPack !== '') {
    where.isUnPack = filters.isUnPack === 'true' || filters.isUnPack === true
  }

  // Range filter for date
  if (range.start && range.end) {
    where.data = {
      [Op.between]: [new Date(range.start), new Date(range.end)]
    }
  }

  const { rows, count } = await dfeLoteDistRepository.findAll(transaction, {
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]]
  })

  return { items: rows, total: count, page, limit, filters, range, sortBy, sortOrder }
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const item = await dfeLoteDistRepository.findOne(transaction, {
    where: { id, companyId: session.company.id }
  })

  if (!item)
    throw { code: "DISTRIBUTION_NOT_FOUND", message: "Distribuição não encontrada!" }

  return item
}

export async function getDecodedDoc(transaction, id) {
  const item = await findOne(transaction, id)
  if (!item || !item.docXml) return null

  return item.docXml
}
