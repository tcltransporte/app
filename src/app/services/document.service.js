"use server"

import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"
import { Op } from "sequelize"

export async function findAll({ slug, page = 1, limit = 50, filters = {} } = {}) {
    try {
        const session = await getSession()
        const db = new AppContext()

        const where = {
            companyId: session.company.id
        }

        if (slug) {
            const docType = await db.DocumentType.findOne({
                where: { initials: slug.toUpperCase() }
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

        const { rows, count } = await db.Document.findAndCountAll({
            where,
            include: [
                { association: 'partner', attributes: ['name', 'surname'] },
                { association: 'documentType', attributes: ['description', 'initials'] }
            ],
            limit,
            offset: (page - 1) * limit,
            order: [['invoiceDate', 'DESC']]
        })

        return ServiceResponse.success({
            items: rows.map(r => r.get({ plain: true })),
            total: count,
            page,
            limit
        })

    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findOne(id) {
    try {
        const db = new AppContext()
        const item = await db.Document.findByPk(id, {
            include: [
                { association: 'partner' },
                { association: 'documentType' },
                { association: 'items', include: ['product'] }
            ]
        })

        console.log(item)

        if (!item) return ServiceResponse.error("NOT_FOUND", "Documento não encontrado")

        return ServiceResponse.success(item.get({ plain: true }))
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function update(id, data) {
    try {
        const db = new AppContext()
        const item = await db.Document.findByPk(id)
        if (!item) return ServiceResponse.error("NOT_FOUND", "Documento não encontrado")

        await item.update(data)

        return ServiceResponse.success(item.get({ plain: true }))
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function create(data) {
    try {
        const session = await getSession()
        const db = new AppContext()

        const payload = {
            ...data,
            companyId: session.company.id
        }

        const item = await db.Document.create(payload)

        return ServiceResponse.success(item.get({ plain: true }))
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
