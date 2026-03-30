"use server"

import * as documentRepository from "@/app/repositories/document.repository"
import * as financeService from "./finance.service"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"
import { Op } from "sequelize"

export async function findAll({ db, transaction } = {}, { slug, page = 1, limit = 50, filters = {}, sortBy = 'invoiceDate', sortOrder = 'DESC' } = {}) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const execute = async (t) => {
            const where = {
                companyId: session.company.id
            }

            if (slug) {
                const docType = await _db.DocumentType.findOne({
                    where: { initials: slug.toUpperCase() },
                    transaction: t
                })
                if (docType) {
                    where.documentModelId = docType.id
                } else {
                    return ServiceResponse.error("DOCUMENT_TYPE_NOT_FOUND", "Tipo de documento não encontrado.")
                }
            }

            if (filters.invoiceNumber) {
                where.invoiceNumber = { [Op.like]: `%${filters.invoiceNumber}%` }
            }

            const { rows, count } = await documentRepository.findAll({ db: _db, transaction: t }, {
                where,
                include: [
                    { association: 'partner', attributes: ['name', 'surname'] },
                    { association: 'documentType', attributes: ['description', 'initials'] }
                ],
                limit,
                offset: (page - 1) * limit,
                order: [[sortBy, sortOrder]]
            })

            return ServiceResponse.success({
                items: rows,
                total: count,
                slug,
                page,
                limit,
                filters,
                sortBy,
                sortOrder
            })
        }

        if (transaction) {
            return await execute(transaction)
        }
        return await _db.transaction(execute)

    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findOne({ db, transaction } = {}, id) {
    try {
        const _db = db || new AppContext()
        const item = await documentRepository.findOne({ db: _db, transaction }, {
            where: { id },
            include: [
                { association: 'partner' },
                { association: 'documentType' },
                { association: 'items', include: ['product'] },
                { association: 'services', include: ['service'] }
            ]
        })

        if (!item) return ServiceResponse.error("NOT_FOUND", "Documento não encontrado")

        return ServiceResponse.success(item)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function update({ db, transaction } = {}, id, data) {
    try {
        const _db = db || new AppContext()

        const execute = async (t) => {
            const existing = await documentRepository.findOne({ db: _db, transaction: t }, {
                attributes: ['id'],
                where: { id }
            })
            if (!existing) throw ServiceResponse.error("NOT_FOUND", "Documento não encontrado")

            await documentRepository.update({ db: _db, transaction: t }, { where: { id } }, data)
        }

        if (transaction) {
            await execute(transaction)
        } else {
            await _db.transaction(execute)
        }

        return findOne({ db: _db, transaction }, id)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function create({ db, transaction } = {}, data) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const execute = async (t) => {
            return await documentRepository.create({ db: _db, transaction: t }, {
                ...data,
                companyId: session.company.id
            })
        }

        const result = transaction ? await execute(transaction) : await _db.transaction(execute)

        return findOne({ db: _db, transaction }, result.id)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function generateFinance({ db, transaction } = {}, ids, financeEntries = []) {
    try {

        const session = await getSession()
        const _db = db || new AppContext()

        const execute = async (t) => {
            const idList = Array.isArray(ids) ? ids : [ids]

            const docs = await _db.Document.findAll({
                where: { id: idList, companyId: session.company.id },
                transaction: t
            })

            if (docs.length === 0) {
                return ServiceResponse.error(new Error("Nenhum documento encontrado"))
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

            const financeResponse = await financeService.create({ db: _db, transaction: t }, titleData)

            if (financeResponse.header.status !== ServiceStatus.SUCCESS) throw new Error(financeResponse.header.message)

            const financeId = financeResponse.body.id

            await _db.Document.update({ financeTitleId: financeId }, {
                where: { id: idList, companyId: session.company.id },
                transaction: t
            })

            return ServiceResponse.success({ id: financeId })
        }

        if (transaction) {
            return await execute(transaction)
        }
        return await _db.transaction(execute)

    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function transmit({ db, transaction } = {}, id) {
    const _db = db || new AppContext()
    const response = await findOne({ db: _db, transaction }, id)

    if (response.header.status !== ServiceStatus.SUCCESS) return

    const doc = response.body
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