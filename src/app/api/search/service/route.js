import { AppContext } from "@/database"
import { Op } from "sequelize"
import { getSession } from "@/libs/session"

export async function POST(request) {
    try {
        const { search } = await request.json()
        const session = await getSession()

        if (!session?.company?.id) {
            return new Response(JSON.stringify({ message: "Sessão inválida" }), { status: 401 })
        }

        const db = new AppContext()
        const where = []

        if (search && typeof search === 'string') {
            const searchUpper = search.replace(/ /g, "%").toUpperCase()
            const isNumeric = !isNaN(search) && search.trim() !== ''

            const searchConditions = [
                { description: { [Op.like]: `%${searchUpper}%` } }
            ]

            if (isNumeric) {
                searchConditions.push({ id: search })
            }

            where.push({ [Op.or]: searchConditions })
        }

        const services = await db.Service.findAll({
            attributes: ['id', 'description'],
            order: [['description', 'asc']],
            where,
            limit: 50
        })

        return Response.json(services.map(s => s.toJSON()))

    } catch (error) {
        console.error('Error searching services:', error)
        return new Response(JSON.stringify({ message: error.message }), { status: 500 })
    }
}