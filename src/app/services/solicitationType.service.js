"use server"

import { Op } from 'sequelize'
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll({ page = 1, limit = 50, filters = {} } = {}) {
  try {
    const session = await getSession()
    const db = new AppContext()

    const result = await db.transaction(async (transaction) => {
      const offset = (page - 1) * limit

      const where = {
        companyId: session.company.id
      }

      if (filters.description) {
        where.description = { [Op.like]: `%${filters.description}%` }
      }
      
      if (filters.requestType) {
        where.requestType = filters.requestType
      }

      return typeRepository.findAll({ db, transaction }, {
        where,
        limit,
        offset,
        order: [['order', 'ASC'], ['description', 'ASC']]
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
      const tipo = await typeRepository.findOne({ db, transaction }, {
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!tipo)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      return tipo
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
      // Get current max order to append at the end
      const maxOrder = await db.SolicitationType.max('order', { 
        where: { companyId: session.company.id },
        transaction 
      }) || 0;

      return typeRepository.create({ db, transaction }, {
        ...data,
        order: maxOrder + 1,
        companyId: session.company.id
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
      const existing = await typeRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      await typeRepository.update({ db, transaction }, { where: { id: id } }, data)
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
      const existing = await typeRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      await typeRepository.destroy({ db, transaction }, { where: { id: id } })
    })

    return ServiceResponse.success({ id })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function updateOrders(orderPairs) {
  try {
    const session = await getSession()
    const db = new AppContext()

    await db.transaction(async (transaction) => {
      for (const pair of orderPairs) {
        await typeRepository.update({ db, transaction }, { 
          where: { 
            id: pair.id,
            companyId: session.company.id
          } 
        }, { order: pair.order })
      }
    })

    return ServiceResponse.success(true)
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
