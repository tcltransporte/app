"use server"

import { Op } from 'sequelize'
import * as solicitationRepository from "@/app/repositories/solicitation.repository"
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus, sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"
import { handleGoogleSheetsExport, handleExcelExport } from "@/libs/export-helper"

export async function exportTable({
  format = 'excel',
  filters = {},
  range = {},
  sortBy = 'date',
  sortOrder = 'DESC',
  columns = []
} = {}) {

  const result = await findAll({ filters, range, sortBy, sortOrder, page: 1, limit: 10000 });

  if (result.status !== ServiceStatus.SUCCESS) return result;

  // Convert to plain objects to ensure all properties are accessible by helpers
  const plainItems = (result.items || []).map(item =>
    typeof item.get === 'function' ? item.get({ plain: true }) : item
  );

  if (format === 'sheets') {
    return handleGoogleSheetsExport({
      items: plainItems,
      columns,
      title: 'Exportação de Solicitações'
    });
  }

  return handleExcelExport({
    items: plainItems,
    columns
  });
}

export async function findAll({ page = 1, limit = 50, filters = {}, range = {}, sortBy = 'date', sortOrder = 'DESC' } = {}) {
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

      if (filters.typeId) {
        where.typeId = filters.typeId
      }

      if (filters.statusId) {
        where.statusId = filters.statusId
      }

      if (filters.number) {
        where.number = filters.number
      }

      if (filters.partnerId) {
        where.partnerId = filters.partnerId
      }

      if (filters.typeHash) {
        const type = await typeRepository.findOne({ db, transaction }, {
          where: { hash: filters.typeHash, companyId: session.company.id }
        })
        if (type) {
          where.typeId = type.id
        }
      }

      // Range Filter
      /*
      if (range.field && (range.start || range.end)) {
        let dateCondition = {}
        if (range.start && range.end) {
          dateCondition = { [Op.between]: [`${range.start}T00:00:00`, `${range.end}T23:59:59`] }
        } else if (range.start) {
          dateCondition = { [Op.gte]: `${range.start}T00:00:00` }
        } else if (range.end) {
          dateCondition = { [Op.lte]: `${range.end}T23:59:59` }
        }
        where[range.field] = dateCondition
      }
      */

      return solicitationRepository.findAll({ db, transaction }, {
        where,
        limit,
        offset,
        order: [[sortBy || 'date', sortOrder || 'DESC']],
        include: [
          { association: 'partner', attributes: ['name', 'surname'] },
        ]
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
      const solicitation = await solicitationRepository.findOne({ db, transaction }, {
        attributes: ['id', 'description', 'number', 'date', 'forecastDate', 'typeId', 'statusId', 'partnerId'],
        where: {
          id: id,
          //companyId: session.company.id
        },
        include: [
          { association: 'partner', attributes: ['name', 'surname'] },
          {
            association: 'products',
            attributes: ['id', 'itemId', 'quantity', 'value', 'supplierId'],
            include: [{ association: 'product', attributes: ['name', 'productCode'] }]
          },
          {
            association: 'services',
            attributes: ['id', 'itemId', 'quantity', 'value', 'supplierId', 'description'],
            include: [{ association: 'service', attributes: ['name'] }]
          },
          { association: 'payments', attributes: ['id', 'documentNumber', 'dueDate', 'issueDate', 'costCenterId', 'value', 'description', 'installment'] }
        ]
      })

      if (!solicitation)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      return solicitation

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

      if (finalData.typeHash && !finalData.typeId) {
        const type = await typeRepository.findOne({ db, transaction }, {
          where: { hash: finalData.typeHash, companyId: session.company.id }
        })
        if (type) {
          finalData.typeId = type.id
        }
      }

      delete finalData.partner

      return solicitationRepository.create({ db, transaction }, {
        ...finalData,
        companyId: session.company.id,
        userId: session.user.id,
        date: new Date(),
        forecastDate: new Date(),
        number: data.number || 0
      }, {
        include: [
          { association: 'products' },
          { association: 'services' },
          { association: 'payments' }
        ]
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
      const existing = await solicitationRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      const finalData = sanitize(data)

      if (finalData.typeHash && !finalData.typeId) {
        const type = await typeRepository.findOne({ db, transaction }, {
          where: { hash: finalData.typeHash, companyId: session.company.id }
        })
        if (type) {
          finalData.typeId = type.id
        }
      }
      delete finalData.typeHash
      delete finalData.partner

      await solicitationRepository.update({ db, transaction }, { where: { id: id } }, finalData)

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
      const existing = await solicitationRepository.findOne({ db, transaction }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      await solicitationRepository.destroy({ db, transaction }, { where: { id: id } })
    })

    return ServiceResponse.success({ id })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
