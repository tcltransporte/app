"use server"

import { AppContext } from "@/database"
import { Op } from "sequelize"
import { ServiceResponse } from "@/libs/service"

export async function findAll(transaction) {
    const db = new AppContext()

    const items = await db.DocumentType.findAll({
        attributes: ['id', 'surname', 'initials'],
        where: {
            surname: { [Op.ne]: null }
        },
        order: [['surname', 'ASC']],
        transaction
    })

    return { items: items.map(i => i.get({ plain: true })) }
}
