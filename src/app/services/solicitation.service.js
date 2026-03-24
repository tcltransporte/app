"use server"

import { Op } from 'sequelize'
import * as solicitationRepository from "@/app/repositories/solicitation.repository"
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import * as documentRepository from "@/app/repositories/document.repository.js"
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

export async function findAll({ page = 1, limit = 50, filters = {}, range = {}, sortBy = 'id', sortOrder = 'DESC' } = {}) {
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

      return solicitationRepository.findAll({ db, transaction }, {
        attributes: ['id', 'number', 'partnerId', 'description', 'date', 'statusId'],
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          { association: 'partner', attributes: ['name', 'surname'] },
          { association: 'solicitationStatus', attributes: ['description', 'generateDocumentTypeId'] },
          { association: 'payments', attributes: ['value'] },
          { association: 'products', attributes: ['id', 'value', 'quantity'] },
          { association: 'services', attributes: ['id', 'value', 'quantity'] },
          { association: 'documents' },
        ]
      })
    })

    return ServiceResponse.success({ items: result.rows, total: result.count, page, limit, sortBy, sortOrder, filters, range })

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
          { association: 'solicitationStatus', attributes: ['description'] },
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

      await solicitationRepository.update({ db, transaction }, { where: { id: id } }, finalData)
    })

    return ServiceResponse.success({ id })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function toStatus(id, statusId, description = null) {
  try {

    const session = await getSession()

    const db = new AppContext()

    await db.transaction(async (transaction) => {

      const existing = await solicitationRepository.findOne({ db, transaction }, {
        attributes: ['id', 'partnerId', 'companyId', 'statusId'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      const updateData = { statusId };

      if (description !== null) updateData.description = description;

      await solicitationRepository.update({ db, transaction }, { where: { id: id } }, updateData)

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

/*
export async function findAllStatuses() {
  try {
    const db = new AppContext()
    const statuses = await db.SolicitationStatus.findAll({
      attributes: ['id', 'description'],
      order: [['id', 'ASC']]
    })
    return ServiceResponse.success({ items: statuses.map(s => s.get({ plain: true })) })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
*/

export async function findAllowedTransitions(fromStatusIds) {
  try {
    const db = new AppContext()

    // If no status is provided, we can't determine allowed transitions
    if (!fromStatusIds || fromStatusIds.length === 0) {
      return ServiceResponse.success({ items: [] })
    }

    const uniqueFromStatusIds = [...new Set(fromStatusIds)]

    // Find transitions for each unique status
    const allowedByStatus = await Promise.all(
      uniqueFromStatusIds.map(async (fromId) => {
        const transitions = await db.SolicitationStatusWorkflow.findAll({
          where: { fromStatusId: fromId },
          include: [{ as: 'toStatus', model: db.SolicitationStatus }]
        })
        return transitions.map(t => t.toStatus.get({ plain: true }))
      })
    )

    // Find intersection of allowed statuses
    if (allowedByStatus.length === 0) return ServiceResponse.success({ items: [] })

    let intersection = allowedByStatus[0]
    for (let i = 1; i < allowedByStatus.length; i++) {
      intersection = intersection.filter(status =>
        allowedByStatus[i].some(s => s.id === status.id)
      )
    }

    return ServiceResponse.success({ items: intersection })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

/*
export async function findAllStatusRelationships() {
  try {
    const db = new AppContext()
    const relationships = await db.SolicitationStatusWorkflow.findAll()
    return ServiceResponse.success({ items: relationships.map(r => r.get({ plain: true })) })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function updateStatusRelationships(fromStatusId, toStatusIds) {
  try {
    const db = new AppContext()

    // We update within a transaction to ensure atomicity
    const transaction = await db.transaction()

    try {
      // 1. Delete existing transitions for this source
      await db.SolicitationStatusWorkflow.destroy({
        where: { fromStatusId },
        transaction
      })

      // 2. Insert new transitions
      if (toStatusIds && toStatusIds.length > 0) {
        const newTransitions = toStatusIds.map(toId => ({
          fromStatusId,
          toStatusId: toId
        }))
        await db.SolicitationStatusWorkflow.bulkCreate(newTransitions, { transaction })
      }

      await transaction.commit()
      return ServiceResponse.success({ message: 'Fluxo atualizado!' })
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
*/

/*
export async function findDocuments(solicitationId) {
  try {

    const session = await getSession()

    const db = new AppContext()

    const documents = await db.Document.findAll({
      attributes: ['id', 'documentModelId', 'invoiceNumber', 'invoiceDate', 'invoiceValue'],
      where: { solicitationId, companyId: session.company.id },
      include: [{ association: 'documentType', attributes: ['id', 'description', 'initials'] }],
      order: [['id', 'ASC']]
    })

    return ServiceResponse.success({ items: documents.map(d => d.get({ plain: true })) })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
*/

export async function saveDocuments(solicitationId, documents = []) {
  try {

    const session = await getSession()

    const db = new AppContext()

    await db.transaction(async (transaction) => {

      const solicitation = await db.Solicitation.findOne({
        attributes: ['id', 'partnerId'],
        where: { id: solicitationId, companyId: session.company.id }
      })

      if (!solicitation) throw ServiceResponse.badRequest('SOLICITATION_NOT_FOUND', 'Solicitação não encontrada!')

      for (const doc of documents) {

        const payload = {
          documentModelId: doc.documentModelId,
          invoiceNumber: doc.invoiceNumber || 0,
          invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate) : new Date(),
          invoiceValue: doc.invoiceValue || 0,
        }
        if (doc.id) {
          await documentRepository.update({ db, transaction }, { where: { id: doc.id } }, payload)
        } else {
          const createdDoc = await documentRepository.create({ db, transaction }, {
            ...payload,
            solicitationId,
            partnerId: solicitation.partnerId,
            companyId: session.company.id,
            createdById: session.user.id,
            createdAt: new Date(),
            systemDate: new Date(),
          })
          doc.id = createdDoc.id
        }

        // Always ensure relationship exists in solicitationDocument
        await db.SolicitationDocument.findOrCreate({
          where: { solicitationId, documentId: doc.id },
          transaction
        })
      }
    })

    return ServiceResponse.success({ message: 'Documentos salvos com sucesso!' })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function generateDocuments(solicitationIds = []) {
  try {

    const session = await getSession()

    const db = new AppContext()

    const solicitations = await db.Solicitation.findAll({
      where: { id: solicitationIds, companyId: session.company.id },
      include: [
        { association: 'partner', attributes: ['name', 'surname'] },
        { association: 'products', attributes: ['id', 'value', 'quantity'] },
        { association: 'services', attributes: ['id', 'value', 'quantity'] },
        { association: 'documents' },
        { association: 'payments', attributes: ['value'] },
        { association: 'solicitationStatus', attributes: ['id', 'generateDocumentTypeId'] }
      ]
    })

    const docTypes = await db.DocumentType.findAll({ attributes: ['id', 'initials'] })

    const type55 = docTypes.find(dt => dt.id && String(dt.id).trim() === '55')
    const type99 = docTypes.find(dt => dt.id && String(dt.id).trim() === '99')

    const defaultType = docTypes.length > 0 ? docTypes[0] : null

    const items = solicitations.map(sRow => {

      const s = sRow.toJSON()

      if (!s.documents || s.documents.length === 0) {

        s.documents = [];

        const hasProducts = (s.products || []).length > 0;
        const hasServices = (s.services || []).length > 0;
        const defaultInvoiceDate = new Date().toISOString();

        if (hasProducts && type55) {
          const total = (s.products || []).reduce((acc, p) => acc + (parseFloat(p.value || 0) * (p.quantity || 1)), 0);
          s.documents.push({ id: null, documentModelId: type55.id, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: total });
        }
        if (hasServices && type99) {
          const total = (s.services || []).reduce((acc, p) => acc + (parseFloat(p.value || 0) * (p.quantity || 1)), 0);
          s.documents.push({ id: null, documentModelId: type99.id, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: total });
        }
        if (s.documents.length === 0 && s.solicitationStatus?.generateDocumentTypeId) {
          s.documents.push({ id: null, documentModelId: s.solicitationStatus.generateDocumentTypeId, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
        }
        if (s.documents.length === 0 && defaultType) {
          s.documents.push({ id: null, documentModelId: defaultType.id, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
        }

      }

      return s;

    });

    return ServiceResponse.success({ items })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
