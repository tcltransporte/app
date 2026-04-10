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
    const where = {}

    if (search) {
      const searchUpper = search.replace(/ /g, "%").toUpperCase()
      where.description = { [Op.like]: `%${searchUpper}%` }
    }

    const rows = await db.CostCenter.findAll({
      where,
      limit: 50,
      order: [['description', 'ASC']]
    })

    const data = rows.map((r) => r.toJSON())

    return Response.json(data)

  } catch (error) {
    console.error('Error in /api/search/cost-center:', error)
    return new Response(JSON.stringify({ message: error.message }), { status: 500 })
  }
}
