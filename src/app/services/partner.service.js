"use server"

import { Op } from 'sequelize'
import * as partnerRepository from "@/app/repositories/partner.repository"
import { ServiceResponse, sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, sortBy = 'surname', sortOrder = 'ASC' } = {}) {
  const session = await getSession()
  const offset = (page - 1) * limit

  const where = {
    companyBusinessId: session.company.companyBusiness.id
  }

  // Advanced Filters
  if (filters.id) where.id = filters.id
  if (filters.cpfCnpj) where.cpfCnpj = { [Op.like]: `%${filters.cpfCnpj}%` }
  if (filters.name) where.name = { [Op.like]: `%${filters.name}%` }
  if (filters.surname) where.surname = { [Op.like]: `%${filters.surname}%` }
  if (filters.typeId) where.typeId = filters.typeId
  if (filters.isActive !== undefined && filters.isActive !== '') {
    where.isActive = filters.isActive === 'true' || filters.isActive === true
  }
  if (filters.isCustomer) where.isCustomer = true
  if (filters.isSupplier) where.isSupplier = true
  if (filters.isEmployee) where.isEmployee = true
  if (filters.isSeller) where.isSeller = true

  const result = await partnerRepository.findAll(transaction, {
    attributes: ['id', 'cpfCnpj', 'name', 'surname', 'typeId', 'isCustomer', 'isSupplier', 'isEmployee', 'isSeller', 'isActive', 'birthDate'],
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]]
  })

  return { items: result.rows, total: result.count, page, limit, filters, sortBy, sortOrder }
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const partner = await partnerRepository.findOne(transaction, {
    where: {
      id: id,
      companyBusinessId: session.company.companyBusiness.id
    }
  })

  if (!partner)
    throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

  return partner
}

export async function create(transaction, data) {
  const session = await getSession()
  const finalData = sanitize(data)

  const result = await partnerRepository.create(transaction, {
    ...finalData,
    companyBusinessId: session.company.companyBusiness.id,
    companyId: session.company.id,
    isActive: true
  })

  return result
}

export async function update(transaction, id, data) {
  const session = await getSession()
  const existing = await partnerRepository.findOne(transaction, {
    attributes: ['id'],
    where: {
      id: id,
      companyBusinessId: session.company.companyBusiness.id
    }
  })

  if (!existing)
    throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

  const finalData = sanitize(data)
  await partnerRepository.update(transaction, { where: { id: id } }, finalData)

  return { id }
}

export async function destroy(transaction, id) {
  const session = await getSession()
  const existing = await partnerRepository.findOne(transaction, {
    attributes: ['id'],
    where: {
      id: id,
      companyBusinessId: session.company.companyBusiness.id
    }
  })

  if (!existing)
    throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

  await partnerRepository.destroy(transaction, { where: { id: id } })
  return { id }
}
