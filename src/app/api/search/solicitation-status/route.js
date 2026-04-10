import { AppContext } from "@/database"
import { Op } from "sequelize"

export async function POST(request) {
    try {
        const { search } = await request.json()
        const db = new AppContext()

        const where = {}
        if (search && typeof search === 'string') {
            where.description = { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` }
        }

        const statuses = await db.SolicitationStatus.findAll({
            attributes: ['id', 'description'],
            where,
            limit: 20,
            order: [['description', 'ASC']]
        })

        return Response.json(statuses)

    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 })
    }
}
