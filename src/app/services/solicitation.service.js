"use server"

import { Op } from 'sequelize'
import * as solicitationRepository from "@/app/repositories/solicitation.repository"
import * as typeRepository from "@/app/repositories/solicitationType.repository"
import { AppContext } from "@/database"
import { sanitize } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll(transaction, { page = 1, limit = 50, filters = {}, range = {}, sortBy = 'number', sortOrder = 'DESC' }) {
  const session = await getSession()
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
    const type = await typeRepository.findOne(transaction, {
      where: { hash: filters.typeHash, companyId: session.company.id }
    })
    if (type) {
      where.typeId = type.id
    }
  }

  const { rows, count } = await solicitationRepository.findAll(transaction, {
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

  return { items: rows, total: count, page, limit, filters, range, sortBy, sortOrder }
}

export async function findOne(transaction, id) {
  const session = await getSession()
  const solicitation = await solicitationRepository.findOne(transaction, {
    attributes: ['id', 'description', 'number', 'date', 'forecastDate', 'typeId', 'statusId', 'partnerId'],
    where: { id },
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
    throw { code: "SOLICITATION_NOT_FOUND", message: "Solicitação não encontrada!" }

  return solicitation
}

export async function create(transaction, data) {
  const session = await getSession()
  const finalData = sanitize(data)

  const result = await solicitationRepository.create(transaction, {
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

  return result
}

export async function update(transaction, id, data) {
  const session = await getSession()
  const existing = await solicitationRepository.findOne(transaction, {
    attributes: ['id'],
    where: { id, companyId: session.company.id }
  })

  if (!existing)
    throw { code: "SOLICITATION_NOT_FOUND", message: "Solicitação não encontrada!" }

  const finalData = sanitize(data)
  await solicitationRepository.update(transaction, { where: { id } }, finalData)

  return { id }
}

export async function toStatus(transaction, id, statusId, description = null) {
  const session = await getSession()
  const existing = await solicitationRepository.findOne(transaction, {
    attributes: ['id', 'partnerId', 'companyId', 'statusId'],
    where: { id, companyId: session.company.id }
  })

  if (!existing)
    throw { code: "SOLICITATION_NOT_FOUND", message: "Solicitação não encontrada!" }

  const updateData = { statusId };
  if (description !== null) updateData.description = description;

  await solicitationRepository.update(transaction, { where: { id } }, updateData)
  return { id }
}

export async function destroy(transaction, id) {
  const session = await getSession()
  const existing = await solicitationRepository.findOne(transaction, {
    attributes: ['id'],
    where: { id, companyId: session.company.id }
  })

  if (!existing)
    throw { code: "SOLICITATION_NOT_FOUND", message: "Solicitação não encontrada!" }

  await solicitationRepository.destroy(transaction, { where: { id } })
  return { id }
}

export async function findAllowedTransitions(transaction, fromStatusIds) {
  const db = new AppContext()

  if (!fromStatusIds || fromStatusIds.length === 0) {
    return { items: [] }
  }

  const uniqueFromStatusIds = [...new Set(fromStatusIds)]

  const allowedByStatus = await Promise.all(
    uniqueFromStatusIds.map(async (fromId) => {
      const transitions = await db.SolicitationStatusWorkflow.findAll({
        where: { fromStatusId: fromId },
        include: [{ as: 'toStatus', model: db.SolicitationStatus }],
        transaction
      })
      return transitions.map(t => t.toStatus.get({ plain: true }))
    })
  )

  if (allowedByStatus.length === 0) return { items: [] }

  let intersection = allowedByStatus[0]
  for (let i = 1; i < allowedByStatus.length; i++) {
    intersection = intersection.filter(status =>
      allowedByStatus[i].some(s => s.id === status.id)
    )
  }

  return { items: intersection }
}

export async function findOneForDocuments(transaction, id) {
  const session = await getSession()
  const db = new AppContext()
  const solicitation = await db.Solicitation.findOne({
    attributes: ['id', 'partnerId'],
    where: { id, companyId: session.company.id },
    include: [{ association: 'payments', attributes: ['installment', 'value', 'dueDate', 'description'] }],
    transaction
  })

  if (!solicitation) throw { code: 'SOLICITATION_NOT_FOUND', message: 'Solicitação não encontrada!' };
  return solicitation;
}

export async function linkDocument(transaction, solicitationId, documentId) {
  const db = new AppContext()
  await db.SolicitationDocument.findOrCreate({
    where: { solicitationId, documentId },
    transaction
  })
}

export async function generateDocuments(transaction, solicitationIds = []) {
  const session = await getSession()
  const db = new AppContext()

  const solicitations = await db.Solicitation.findAll({
    where: { id: solicitationIds, companyId: session.company.id },
    include: [
      { association: 'partner', attributes: ['id', 'name', 'surname'] },
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
      { association: 'type', attributes: ['id', 'description', 'requestType'] },
      { association: 'status', attributes: ['id', 'generateDocumentTypeId'] }
    ],
    transaction
  })

  const docTypes = await db.DocumentType.findAll({ attributes: ['id', 'initials'], transaction })

  const type55 = docTypes.find(dt => dt.id && String(dt.id).trim() === '55')
  const type99 = docTypes.find(dt => dt.id && String(dt.id).trim() === '99')

  const defaultType = docTypes.length > 0 ? docTypes[0] : null

  //const company = await db.Company.findByPk(session.company.id, { attributes: ['id', 'invoiceSerie'], transaction });
  //const defaultInvoiceSerie = company?.invoiceSerie || '';

  const items = solicitations.map(sRow => {
    const s = sRow.toJSON()

    if (s.alreadyGenerated) {
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
        partner: s.partner,
        documentModelId: type55.id,
        requestTypeId: s.type?.requestType,
        invoiceDate: defaultInvoiceDate,
        //invoiceNumber: 0,
        //invoiceSerie: defaultInvoiceSerie,
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
        partner: s.partner,
        documentModelId: type99.id,
        requestTypeId: s.type?.requestType,
        invoiceDate: defaultInvoiceDate,
        //invoiceNumber: 0,
        //invoiceSerie: defaultInvoiceSerie,
        invoiceValue: total,
        services: docItems
      });
    }
    if (s.documents.length === 0 && s.status?.generateDocumentTypeId) {
      s.documents.push({ id: null, partner: s.partner, documentModelId: s.status.generateDocumentTypeId, requestTypeId: s.type?.requestType, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
    }
    if (s.documents.length === 0 && defaultType) {
      s.documents.push({ id: null, partner: s.partner, documentModelId: defaultType.id, requestTypeId: s.type?.requestType, invoiceDate: defaultInvoiceDate, invoiceValue: 0 });
    }

    return s;
  });

  return { items };
}

export async function generateFreightLetters(transaction, solicitationIds = []) {
  const session = await getSession()
  const db = new AppContext()

  const solicitations = await db.Solicitation.findAll({
    where: { id: solicitationIds, companyId: session.company.id },
    include: [
      { association: 'partner', attributes: ['id', 'name', 'surname'] },
      { association: 'payments' },
      { association: 'freightLetters' }
    ],
    transaction
  })

  const items = solicitations.map(sRow => {
    const s = sRow.toJSON()

    if (s.freightLetters && s.freightLetters.length > 0) {
      s.alreadyGenerated = true;
      return s;
    }

    s.alreadyGenerated = false;
    s.freightLetters = [];

    return s;
  });

  return { items };
}
