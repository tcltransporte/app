"use server"

import { Op } from 'sequelize'
import * as partnerRepository from "@/app/repositories/partner.repository"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll({ page = 1, limit = 50, search = '' } = {}) {
  try {

    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {

      const offset = (page - 1) * limit

      const where = {
        companyBusinessId: session.company.companyBusiness.id
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { surname: { [Op.like]: `%${search}%` } },
          { cpfCnpj: { [Op.like]: `%${search}%` } }
        ]
      }

      return partnerRepository.findAll({ db, transaction }, {
        attributes: ['codigo_pessoa', 'cpfCnpj', 'name', 'surname', 'typeId', 'isCustomer', 'isSupplier', 'isEmployee', 'isSeller', 'isActive'],
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
          codigo_pessoa: id,
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
        attributes: ['codigo_pessoa'],
        where: {
          codigo_pessoa: id,
          companyBusinessId: session.company.companyBusiness.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

      await partnerRepository.update({ db, transaction }, { where: { codigo_pessoa: id } }, data)

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
        attributes: ['codigo_pessoa'],
        where: {
          codigo_pessoa: id,
          companyBusinessId: session.company.companyBusiness.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("PARTNER_NOT_FOUND", "Parceiro não encontrado!")

      await partnerRepository.destroy({ db, transaction }, { where: { codigo_pessoa: id } })

    })

    return ServiceResponse.success({ id })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}
