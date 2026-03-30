"use server"

import { Op } from 'sequelize'
import * as solicitationRepository from "@/app/repositories/solicitation.repository"
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import * as documentService from "./document.service"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus, sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"
import { handleGoogleSheetsExport, handleExcelExport } from "@/libs/export-helper"

export async function exportTable({ db, transaction } = {}, {
  format = 'excel',
  filters = {},
  range = {},
  sortBy = 'date',
  sortOrder = 'DESC',
  columns = []
} = {}) {

  const result = await findAll({ db, transaction }, { filters, range, sortBy, sortOrder, page: 1, limit: 10000 });

  if (result.header.status !== ServiceStatus.SUCCESS) return result;

  // Convert to plain objects to ensure all properties are accessible by helpers
  const plainItems = (result.body.items || []).map(item =>
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

export async function findAll({ db, transaction } = {}, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'number', sortOrder = 'DESC' }) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {
      const offset = (page - 1) * limit

      const where = {
        companyId: session.company.id
      }

      if (filters.description) {
        where.description = { [Op.like]: `%${filters.description}%` }
      }

      const statusId = filters.status?.id || filters.status || filters.statusId
      if (statusId) {
        where.statusId = statusId
      }

      const partnerId = filters.partner?.id || filters.partner || filters.partnerId
      if (partnerId) {
        where.partnerId = partnerId
      }

      const typeId = filters.type?.id || filters.type || filters.typeId
      if (typeId) {
        where.typeId = typeId
      }

      if (filters.number) {
        where.number = filters.number
      }

      if (filters.typeHash) {
        const type = await typeRepository.findOne({ db: _db, transaction: t }, {
          where: { hash: filters.typeHash, companyId: session.company.id }
        })
        if (type) {
          where.typeId = type.id
        }
      }

      return solicitationRepository.findAll({ db: _db, transaction: t }, {
        attributes: ['id', 'number', 'partnerId', 'description', 'date', 'statusId'],
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          { association: 'partner', attributes: ['name', 'surname'] },
          { association: 'status', attributes: ['description', 'generateDocumentTypeId'] },
          { association: 'payments', attributes: ['value'] },
          { association: 'products', attributes: ['id', 'value', 'quantity'] },
          { association: 'services', attributes: ['id', 'value', 'quantity'] },
          { association: 'documents' },
        ]
      })
    }

    const { rows, count } = transaction ? await execute(transaction) : await _db.transaction(execute)

    return ServiceResponse.success({ items: rows, total: count, page, limit, filters, range, sortBy, sortOrder })

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function findOne({ db, transaction } = {}, id) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {
      const solicitation = await solicitationRepository.findOne({ db: _db, transaction: t }, {
        attributes: ['id', 'description', 'number', 'date', 'forecastDate', 'typeId', 'statusId', 'partnerId'],
        where: {
          id: id,
          //companyId: session.company.id
        },
        include: [
          { association: 'type', attributes: ['description'] },
          { association: 'status', attributes: ['description'] },
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

    }

    const result = transaction ? await execute(transaction) : await _db.transaction(execute)

    return ServiceResponse.success(result)

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function create({ db, transaction } = {}, data) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {
      const finalData = sanitize(data)

      return await solicitationRepository.create({ db: _db, transaction: t }, {
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
    }

    const result = transaction ? await execute(transaction) : await _db.transaction(execute)

    return ServiceResponse.success(result)

  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function update({ db, transaction } = {}, id, data) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {
      const existing = await solicitationRepository.findOne({ db: _db, transaction: t }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      const finalData = sanitize(data)

      await solicitationRepository.update({ db: _db, transaction: t }, { where: { id: id } }, finalData)
    }

    if (transaction) {
      await execute(transaction)
    } else {
      await _db.transaction(execute)
    }

    return ServiceResponse.success({ id })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function toStatus({ db, transaction } = {}, id, statusId, description = null) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {

      const existing = await solicitationRepository.findOne({ db: _db, transaction: t }, {
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

      await solicitationRepository.update({ db: _db, transaction: t }, { where: { id: id } }, updateData)

    }

    if (transaction) {
      await execute(transaction)
    } else {
      await _db.transaction(execute)
    }

    return ServiceResponse.success({ id })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function destroy({ db, transaction } = {}, id) {
  try {
    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {

      const existing = await solicitationRepository.findOne({ db: _db, transaction: t }, {
        attributes: ['id'],
        where: {
          id: id,
          companyId: session.company.id
        }
      })

      if (!existing)
        throw ServiceResponse.badRequest("SOLICITATION_NOT_FOUND", "Solicitação não encontrada!")

      await solicitationRepository.destroy({ db: _db, transaction: t }, { where: { id: id } })
    }

    if (transaction) {
      await execute(transaction)
    } else {
      await _db.transaction(execute)
    }

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

export async function findAllowedTransitions({ db, transaction } = {}, fromStatusIds) {
  try {
    const _db = db || new AppContext()

    // If no status is provided, we can't determine allowed transitions
    if (!fromStatusIds || fromStatusIds.length === 0) {
      return ServiceResponse.success({ items: [] })
    }

    const uniqueFromStatusIds = [...new Set(fromStatusIds)]

    // Find transitions for each unique status
    const allowedByStatus = await Promise.all(
      uniqueFromStatusIds.map(async (fromId) => {
        const transitions = await _db.SolicitationStatusWorkflow.findAll({
          where: { fromStatusId: fromId },
          include: [{ as: 'toStatus', model: _db.SolicitationStatus }],
          transaction
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

export async function saveDocuments({ db, transaction } = {}, solicitationId, documents = []) {
  try {

    const session = await getSession()
    const _db = db || new AppContext()

    const execute = async (t) => {

      const solicitation = await _db.Solicitation.findOne({
        attributes: ['id', 'partnerId'],
        where: { id: solicitationId, companyId: session.company.id },
        include: [{ association: 'payments', attributes: ['installment', 'value', 'dueDate', 'description'] }],
        transaction: t
      })

      if (!solicitation) throw ServiceResponse.badRequest('SOLICITATION_NOT_FOUND', 'Solicitação não encontrada!')

      const newDocIds = []
      for (const doc of documents) {

        const payload = {
          documentModelId: doc.documentModelId,
          invoiceNumber: doc.invoiceNumber || 0,
          invoiceDate: doc.invoiceDate ? new Date(doc.invoiceDate) : new Date(),
          invoiceValue: doc.invoiceValue || 0,
          items: doc.items,
          services: doc.services,
        }
        if (doc.id) {
          const result = await documentService.update({ db: _db, transaction: t }, doc.id, payload)
          if (result.header.status !== ServiceStatus.SUCCESS) throw new Error(result.header.message)
        } else {
          const result = await documentService.create({ db: _db, transaction: t }, {
            ...payload,
            solicitationId,
            partnerId: solicitation.partnerId,
          })
          if (result.header.status !== ServiceStatus.SUCCESS) throw new Error(result.header.message)
          doc.id = result.body.id
          newDocIds.push(doc.id)

          documentService.transmit({ db: _db, transaction: t }, doc.id)

        }

        // Always ensure relationship exists in solicitationDocument
        await _db.SolicitationDocument.findOrCreate({
          where: { solicitationId, documentId: doc.id },
          transaction: t
        })
      }

      if (newDocIds.length > 0) {
        await documentService.generateFinance({ db: _db, transaction: t }, newDocIds, solicitation.payments)
      }

    }

    if (transaction) {
      await execute(transaction)
    } else {
      await _db.transaction(execute)
    }

    return ServiceResponse.success({ message: 'Documentos salvos com sucesso!' })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}

export async function generateDocuments({ db, transaction } = {}, solicitationIds = []) {
  try {

    const session = await getSession()
    const _db = db || new AppContext()

    const solicitations = await _db.Solicitation.findAll({
      where: { id: solicitationIds, companyId: session.company.id },
      include: [
        { association: 'partner', attributes: ['name', 'surname'] },
        {
          association: 'products',
          attributes: ['id', 'itemId', 'value', 'quantity'],
          include: [{ association: 'product', attributes: ['name'] }]
        },
        {
          association: 'services',
          attributes: ['id', 'itemId', 'value', 'quantity', 'description'],
          include: [{ association: 'service', attributes: ['name'] }]
        },
        { association: 'documents' },
        { association: 'type', attributes: ['id', 'description'] },
        { association: 'status', attributes: ['id', 'generateDocumentTypeId'] }
      ],
      transaction
    })

    const docTypes = await _db.DocumentType.findAll({ attributes: ['id', 'initials'], transaction })

    const type55 = docTypes.find(dt => dt.id && String(dt.id).trim() === '55')
    const type99 = docTypes.find(dt => dt.id && String(dt.id).trim() === '99')

    const defaultType = docTypes.length > 0 ? docTypes[0] : null

    const items = solicitations.map(sRow => {

      const s = sRow.toJSON()

      if (s.documents && s.documents.length > 0) {
        // Solicitation already has documents, don't generate more
        s.alreadyGenerated = true;
        return s;
      }

      s.alreadyGenerated = false;
      s.documents = [];

      const hasProducts = (s.products || []).length > 0;
      const hasServices = (s.services || []).length > 0;
      const defaultInvoiceDate = new Date().toISOString().split('T')[0];

      if (hasProducts && type55) {
        const total = (s.products || []).reduce((acc, p) => acc + (parseFloat(p.value || 0) * (p.quantity || 1)), 0);
        const docItems = (s.products || []).map(p => ({
          itemId: p.itemId,
          quantity: p.quantity,
          value: p.value,
          description: p.description || p.product?.name || ''
        }));
        s.documents.push({
          id: null,
          documentTypeId: type55.id,
          invoiceNumber: 0,
          invoiceDate: defaultInvoiceDate,
          invoiceValue: total,
          items: docItems
        });
      }
      if (hasServices && type99) {
        const total = (s.services || []).reduce((acc, p) => acc + (parseFloat(p.value || 0) * (p.quantity || 1)), 0);
        const docItems = (s.services || []).map(p => ({
          itemId: p.itemId,
          quantity: p.quantity,
          value: p.value,
          description: p.description || p.service?.name || ''
        }));
        s.documents.push({
          id: null,
          documentTypeId: type99.id,
          invoiceNumber: 0,
          invoiceDate: defaultInvoiceDate,
          invoiceValue: total,
          services: docItems
        });
      }
      if (s.documents.length === 0 && s.status?.generateDocumentTypeId) {
        s.documents.push({ id: null, documentTypeId: s.status.generateDocumentTypeId, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
      }
      if (s.documents.length === 0 && defaultType) {
        s.documents.push({ id: null, documentTypeId: defaultType.id, invoiceNumber: 0, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
      }

      return s;

    });

    return ServiceResponse.success({ items })
  } catch (error) {
    return ServiceResponse.error(error)
  }
}
