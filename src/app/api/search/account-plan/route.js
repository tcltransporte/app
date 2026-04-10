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
    const where = {
      isActive: true,
      // idEmpresa: session.company.id // Algumas tabelas usam idEmpresa, outras companyId. Verificando...
    }

    if (search && typeof search === 'string') {
      const searchUpper = search.replace(/ /g, "%").toUpperCase()
      const isNumeric = !isNaN(search) && search.trim() !== ''

      const searchConditions = [
        { description: { [Op.like]: `%${searchUpper}%` } },
        { code: { [Op.like]: `%${searchUpper}%` } }
      ]

      where[Op.or] = searchConditions
    }

    const rows = await db.AccountPlan.findAll({
      attributes: ['id', 'description', 'code'],
      where,
      limit: 50,
      order: [['description', 'ASC']]
    })

    const data = rows.map((r) => r.toJSON())

    return Response.json(data)

  } catch (error) {
    console.error('Error in /api/search/account-plan:', error)
    return new Response(JSON.stringify({ message: error.message }), { status: 500 })
  }
}
