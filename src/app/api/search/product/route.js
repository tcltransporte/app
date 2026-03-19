import { getSession } from "@/libs/session"
import { AppContext } from "@/database"
import { Op } from "sequelize"
import _ from "lodash"

export async function POST(request) {
    try {

        const { search } = await request.json()

        const session = await getSession()

        const db = new AppContext()

        const where = {
            isActive: true
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } },
                { description: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } },
                { internalCode: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } },
                { productCode: { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } }
            ]
        }

        const products = await db.Product.findAll({
            attributes: ['id', 'name', 'description', 'internalCode', 'productCode'],
            where,
            order: [['name', 'asc']],
            limit: 20,
            offset: 0,
        })

        const data = products.map((product) => product.toJSON())

        return Response.json(data)

    } catch (error) {
        console.error('Error searching products:', error)
        return new Response(JSON.stringify({ message: error.message }), { status: 500 })
    }
}
