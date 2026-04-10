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
            isActive: true,
            companyId: session.company.id
        }

        if (search && typeof search === 'string') {
            const searchPattern = `%${search.replace(/ /g, "%").toUpperCase()}%`
            where[Op.or] = [
                { name: { [Op.like]: searchPattern } },
                { description: { [Op.like]: searchPattern } },
                { internalCode: { [Op.like]: searchPattern } },
                { productCode: { [Op.like]: searchPattern } }
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
