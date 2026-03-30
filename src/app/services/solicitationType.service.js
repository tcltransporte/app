"use server"

import { Op } from 'sequelize'
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus, sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll(transaction, { page = 1, limit = 50, filters = {} } = {}) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
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

      if (filters.hash) {
        where.hash = filters.hash
      }

      const { rows, count } = await typeRepository.findAll(t, {
        where,
        limit,
        offset,
        order: [['order', 'ASC'], ['description', 'ASC']]
      })

      return ServiceResponse.success({ items: rows, total: count, page, limit })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      const tipo = await typeRepository.findOne(t, {
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!tipo)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      return ServiceResponse.success(tipo)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function create(transaction, data) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      const finalData = sanitize(data)

      // Get current max order to append at the end
      const maxOrder = await db.SolicitationType.max('order', { 
        where: { companyId: session.company.id },
        transaction: t 
      }) || 0;

      const result = await typeRepository.create(t, {
        ...finalData,
        order: maxOrder + 1,
        companyId: session.company.id
      })

      return ServiceResponse.success(result)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function update(transaction, id, data) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      const existing = await typeRepository.findOne(t, {
        attributes: ['id'],
        where: { id, companyId: session.company.id }
      })

      if (!existing)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      const finalData = sanitize(data)
      await typeRepository.update(t, { where: { id } }, finalData)

      return ServiceResponse.success({ id })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroy(transaction, id) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      const existing = await typeRepository.findOne(t, {
        attributes: ['id'],
        where: { id, companyId: session.company.id }
      })

      if (!existing)
        throw ServiceResponse.badRequest("TYPE_NOT_FOUND", "Tipo de solicitação não encontrado!")

      await typeRepository.destroy(t, { where: { id } })
      return ServiceResponse.success({ id })
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function updateOrders(transaction, orderPairs) {
  const session = await getSession()
  const db = new AppContext()
  try {
    return await db.withTransaction(transaction, async (t) => {
      for (const pair of orderPairs) {
        await typeRepository.update(t, { 
          where: { 
            id: pair.id,
            companyId: session.company.id
          } 
        }, { order: pair.order })
      }
      return ServiceResponse.success(true)
    })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
