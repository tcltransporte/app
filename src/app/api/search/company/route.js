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
      const searchClean = search.replace(/[^a-zA-Z0-9]/g, "")

      where[Op.or] = [
        { name: { [Op.like]: `%${searchUpper}%` } },
        { surname: { [Op.like]: `%${searchUpper}%` } },
        { cnpj: { [Op.like]: `%${searchClean}%` } }
      ]
    }

    const rows = await db.Company.findAll({
      where,
      limit: 50,
      order: [['surname', 'ASC']]
    })

    const data = rows.map((r) => r.toJSON())

    return Response.json(data)

  } catch (error) {
    console.error('Error in /api/search/company:', error)
    return new Response(JSON.stringify({ message: error.message }), { status: 500 })
  }
}
