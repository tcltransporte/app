"use server"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"

export async function findAll(transaction) {
    const db = new AppContext()

    const items = await db.DocumentRequestType.findAll({
        attributes: ['id', 'description'],
        order: [['description', 'ASC']],
        transaction
    })

    return { items: items.map(i => i.get({ plain: true })) }
}
