import { AppContext } from "@/database"
import { Op } from "sequelize"
import { getSession } from "@/libs/session"

export async function POST(request) {
  try {
    const { search, partnerId } = await request.json()
    const session = await getSession()
    const db = new AppContext()

    const where = {
      companyId: session.company.id
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (search) {
      const searchPattern = `%${search.replace(/ /g, "%")}%`
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: searchPattern } },
        // You could add invoiceKey or other identifier fields here if needed
      ]
    }

    const documents = await db.Document.findAll({
      attributes: [
        'id', 'invoiceNumber', 'invoiceSeries', 'invoiceDate', 'receiptDate', 
        'invoiceKey', 'invoiceValue', 'totalProductsValue', 'discountValue', 
        'freightValue', 'insuranceValue', 'otherValues', 'icmsBaseValue', 
        'icmsValue', 'ipiValue', 'pisValue', 'cofinsValue', 'icmsstBaseValue', 
        'icmsstValue', 'documentModelId', 'description'
      ],
      where: where,
      include: [{ association: 'items' }],
      order: [['invoiceDate', 'DESC'], ['id', 'DESC']],
      limit: 20
    })

    const data = documents.map((doc) => {
      const plain = doc.toJSON()
      return {
        ...plain,
        label: `NF ${plain.invoiceNumber} - R$ ${plain.invoiceValue} (${new Date(plain.invoiceDate).toLocaleDateString()})`
      }
    })

    return Response.json(data)

  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 })
  }
}
