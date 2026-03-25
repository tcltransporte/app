"use server"

import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"
import { Op } from "sequelize"

export async function findAll({ slug, page = 1, limit = 50, filters = {}, sortBy = 'invoiceDate', sortOrder = 'DESC' } = {}) {
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
            order: [[sortBy, sortOrder]]
        })

        return ServiceResponse.success({
            items: rows.map(r => r.get({ plain: true })),
            total: count,
            slug,
            page,
            limit,
            filters,
            sortBy,
            sortOrder
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

        const { items, ...documentData } = data

        await db.transaction(async (transaction) => {
            await item.update(documentData, { transaction })

            if (items) {
                const existingItems = await db.DocumentProduct.findAll({ 
                    where: { documentId: id },
                    transaction 
                })
                
                const existingIds = existingItems.map(i => i.id)
                const payloadIds = items.filter(i => i.id).map(i => i.id)

                // Delete removed items
                const toDelete = existingIds.filter(eid => !payloadIds.includes(eid))
                if (toDelete.length > 0) {
                    await db.DocumentProduct.destroy({ 
                        where: { id: { [Op.in]: toDelete } },
                        transaction 
                    })
                }

                // Update or Create items
                for (const row of items) {
                    if (row.id) {
                        await db.DocumentProduct.update(row, { 
                            where: { id: row.id }, 
                            transaction 
                        })
                    } else {
                        await db.DocumentProduct.create({ 
                            ...row, 
                            documentId: id 
                        }, { transaction })
                    }
                }
            }
        })

        return findOne(id)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function create(data) {
    try {
        const session = await getSession()
        const db = new AppContext()

        const { items, ...documentData } = data

        const result = await db.transaction(async (transaction) => {
            const item = await db.Document.create({
                ...documentData,
                companyId: session.company.id
            }, { transaction })

            if (items && items.length > 0) {
                for (const row of items) {
                    await db.DocumentProduct.create({
                        ...row,
                        documentId: item.id
                    }, { transaction })
                }
            }
            return item
        })

        return findOne(result.id)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
