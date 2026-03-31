"use server"

import * as documentRepository from "@/app/repositories/document.repository"
import { AppContext } from "@/database"
import { getSession } from "@/libs/session"
import { Op } from "sequelize"

export async function findAll(transaction, { slug, page = 1, limit = 50, filters = {}, sortBy = 'invoiceDate', sortOrder = 'DESC' } = {}) {
  const session = await getSession()
  const db = new AppContext()

  const where = {
    companyId: session.company.id
  }

  if (slug) {
    const docType = await db.DocumentType.findOne({
      where: { initials: slug.toUpperCase() },
      transaction
    })
    if (docType) {
      where.documentModelId = docType.id
    } else {
      throw { code: "DOCUMENT_TYPE_NOT_FOUND", message: "Tipo de documento não encontrado." }
    }
  }

  if (filters.invoiceNumber) {
    where.invoiceNumber = { [Op.like]: `%${filters.invoiceNumber}%` }
  }

  const { rows, count } = await documentRepository.findAll(transaction, {
    where,
    include: [
      { association: 'partner', attributes: ['name', 'surname'] },
      { association: 'documentType', attributes: ['description', 'initials'] }
    ],
    limit,
    offset: (page - 1) * limit,
    order: [[sortBy, sortOrder]]
  })

  return {
    items: rows,
    total: count,
    slug,
    page,
    limit,
    filters,
    sortBy,
    sortOrder
  }
}

export async function findOne(transaction, id) {
  const item = await documentRepository.findOne(transaction, {
    where: { id },
    include: [
      { association: 'partner' },
      { association: 'documentType' },
      { association: 'items', include: ['product'] },
      { association: 'services', include: ['service'] }
    ]
  })

  if (!item) throw { code: "NOT_FOUND", message: "Documento não encontrado" }

  return item
}

export async function update(transaction, id, data) {
  const existing = await documentRepository.findOne(transaction, {
    attributes: ['id'],
    where: { id }
  })

  if (!existing) throw { code: "NOT_FOUND", message: "Documento não encontrado" }

  await documentRepository.update(transaction, { where: { id } }, data)

  return await findOne(transaction, id)
}

export async function create(transaction, data) {
  const session = await getSession()

  const result = await documentRepository.create(transaction, {
    ...data,
    companyId: session.company.id
  })

  return await findOne(transaction, result.id)
}

export async function prepareFinanceTitleData(transaction, ids, financeEntries = []) {
  const session = await getSession()
  const db = new AppContext()
  const idList = Array.isArray(ids) ? ids : [ids]

  const docs = await db.Document.findAll({
    where: { id: idList, companyId: session.company.id },
    transaction
  })

  if (docs.length === 0) {
    throw new Error("Nenhum documento encontrado")
  }

  const firstDoc = docs[0]
  const totalValue = docs.reduce((acc, d) => acc + parseFloat(d.invoiceValue || 0), 0)

  const titleData = {
    documentNumber: firstDoc.invoiceNumber,
    totalValue: totalValue,
    movementDate: firstDoc.invoiceDate,
    partnerId: firstDoc.partnerId,
    description: firstDoc.description || `Financeiro ref. documentos ${idList.join(', ')}`,
    companyId: firstDoc.companyId,
    issueDate: firstDoc.invoiceDate,
    externalId: String(firstDoc.id),
    entries: []
  }

  if (financeEntries.length > 0) {
    titleData.entries = financeEntries.map(p => ({
      installmentNumber: p.installmentNumber || p.installment || 1,
      installmentValue: p.installmentValue || p.value,
      dueDate: p.dueDate,
      systemDate: new Date(),
      description: p.description
    }))
  } else {
    titleData.entries.push({
      installmentNumber: 1,
      installmentValue: totalValue,
      dueDate: firstDoc.invoiceDate,
      systemDate: new Date(),
      description: 'Parcela única'
    })
  }

  return titleData
}

export async function linkFinanceTitle(transaction, ids, financeTitleId) {
  const session = await getSession()
  const idList = Array.isArray(ids) ? ids : [ids]

  await documentRepository.update(transaction, {
    where: { id: idList, companyId: session.company.id }
  }, { financeTitleId })
}


export async function transmit(transaction, id) {
  const doc = await findOne(transaction, id)
  const type = doc.documentType?.initials

  switch (String(type)) {
    case '55':
    case '65':
      await processNfe(doc)
      break
    case '99':
      await processNfse(doc)
      break
  }
}

async function processNfe(doc) {
  // Logic for sending NFe/NFCe (stub)
  console.log(`Sending NFe/NFCe for document ${doc.id} (Type: ${doc.documentType.initials})`)
}

async function processNfse(doc) {
  // Logic for sending NFSe (stub)
  console.log(`Sending NFSe for document ${doc.id}`)
}
