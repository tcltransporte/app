"use server"

import { Op } from 'sequelize'
import * as partnerRepository from "@/app/repositories/partner.repository"

import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus, sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"
import { handleGoogleSheetsExport, handleExcelExport } from "@/libs/export-helper"

export async function exportTable({
  format = 'excel',
  filters = {},
  range = {},
  sortBy = 'surname',
  sortOrder = 'ASC',
  columns = []
} = {}) {

  const result = await findAll({ filters, range, sortBy, sortOrder, page: 1, limit: 10000 });

  if (result.header.status !== ServiceStatus.SUCCESS) return result;

  // Convert to plain objects to ensure all properties are accessible by helpers
  const plainItems = (result.body.items || []).map(item =>
    typeof item.get === 'function' ? item.get({ plain: true }) : item
  );

  if (format === 'sheets') {
    return handleGoogleSheetsExport({
      items: plainItems,
      columns,
      title: 'Exportação de Parceiros'
    });
  }

  return handleExcelExport({
    items: plainItems,
    columns
  });
}

export async function findAll({ page = 1, limit = 50, filters = {}, sortBy = 'surname', sortOrder = 'ASC' } = {}) {
  try {

    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {

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

      return partnerRepository.findAll({ db, transaction }, {
        attributes: ['id', 'cpfCnpj', 'name', 'surname', 'typeId', 'isCustomer', 'isSupplier', 'isEmployee', 'isSeller', 'isActive', 'birthDate'],
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      })

    })

    return ServiceResponse.success({ items: result.rows, total: result.count, page, limit, filters, sortBy, sortOrder })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findOne(id) {
  try {

    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {

      const partner = await partnerRepository.findOne({ db, transaction }, {
        where: {
          id: id,
          companyBusinessId: session.company.companyBusiness.id
        }
      })

      if (!partner)
        throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

      return partner

    })

    return ServiceResponse.success(result)

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function create(data) {
  try {

    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {
      const finalData = sanitize(data)

      return partnerRepository.create({ db, transaction }, {
        ...finalData,
        companyBusinessId: session.company.companyBusiness.id,
        companyId: session.company.id,
        isActive: true
      })

    })

    return ServiceResponse.success(result)

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function update(id, data) {
  try {

    const session = await getSession()
    const db = new AppContext()

    await db.transaction(async (transaction) => {

      const existing = await partnerRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyBusinessId: session.company.companyBusiness.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

      const finalData = sanitize(data)

      await partnerRepository.update({ db, transaction }, { where: { id: id } }, finalData)

    })

    return ServiceResponse.success({ id })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroy(id) {
  try {

    const session = await getSession()
    const db = new AppContext()

    await db.transaction(async (transaction) => {

      const existing = await partnerRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyBusinessId: session.company.companyBusiness.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

      await partnerRepository.destroy({ db, transaction }, { where: { id: id } })

    })

    return ServiceResponse.success({ id })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}
