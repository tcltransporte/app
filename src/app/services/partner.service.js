"use server"

import { Op } from 'sequelize'
import * as partnerRepository from "@/app/repositories/partner.repository"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll({ page = 1, limit = 50, search = '', filters = {} } = {}) {
  try {

    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {

      const offset = (page - 1) * limit

      const where = {
        companyBusinessId: session.company.companyBusiness.id
      }

      // Quick Search (General)
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { surname: { [Op.like]: `%${search}%` } },
          { cpfCnpj: { [Op.like]: `%${search}%` } }
        ]
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
        order: [['surname', 'ASC']]
      })

    })

    return ServiceResponse.success({ items: result.rows, total: result.count, page, limit })

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

      return partnerRepository.create({ db, transaction }, {
        ...data,
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

      await partnerRepository.update({ db, transaction }, { where: { id: id } }, data)

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
