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
      //companyId: session.company.id
    }

    if (search && typeof search === 'string') {
      const searchUpper = search.replace(/ /g, "%").toUpperCase()
      const searchClean = search.replace(/[^a-zA-Z0-9]/g, "")
      const isNumeric = !isNaN(search) && search.trim() !== ''

      const searchConditions = [
        { description: { [Op.like]: `%${searchUpper}%` } },
        { bankName: { [Op.like]: `%${searchUpper}%` } },
        { accountNumber: { [Op.like]: `%${searchClean}%` } }
      ]

      if (isNumeric) {
        searchConditions.push(
          db.where(
            db.cast(db.col('codigo_conta_bancaria'), 'NVARCHAR'),
            { [Op.like]: `%${search}%` }
          )
        )
      }

      where[Op.or] = searchConditions
    }

    const accounts = await db.BankAccount.findAll({
      attributes: ['id', 'description', 'bankName', 'agency', 'accountNumber'],
      where,
      limit: 20,
      order: [['description', 'ASC']],
      include: [{ association: 'bank', attributes: ['id', 'description'] }]
    })

    const data = accounts.map((acc) => acc.toJSON())

    return Response.json(data)

  } catch (error) {
    console.error('Error in /api/search/bankAccount:', error)
    return new Response(JSON.stringify({ message: error.message }), { status: 500 })
  }
}
