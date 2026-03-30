"use server"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { Op } from "sequelize"

export async function findAll(transaction) {
    const db = new AppContext()
    try {
        return await db.withTransaction(transaction, async (t) => {
            const items = await db.DocumentType.findAll({
                attributes: ['id', 'surname', 'initials'],
                where: {
                    surname: { [Op.ne]: null }
                },
                order: [['surname', 'ASC']],
                transaction: t
            })

            return ServiceResponse.success({ items: items.map(i => i.get({ plain: true })) })
        })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
