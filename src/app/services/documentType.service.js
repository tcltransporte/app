"use server"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { Op } from "sequelize"

export async function findAll() {
    try {
        const db = new AppContext()
        const items = await db.DocumentType.findAll({
            attributes: ['id', 'surname', 'initials'],
            where: {
                surname: { [Op.ne]: null }
            },
            order: [['surname', 'ASC']],
        })
        return ServiceResponse.success({ items: items.map(i => i.get({ plain: true })) })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
