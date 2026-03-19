import { AppContext } from "@/database"
import { Op } from "sequelize"

import _ from "lodash"
import { getSession } from "@/libs/session"

export async function POST(request) {
    try {

        const { search, isCustomer = false, isSupplier = false, isEmployee = false, isSeller = false } = await request.json()

        const session = await getSession()

        const db = new AppContext()

        const where = []

        where.push({ '$nome$': { [Op.like]: `%${search.replace(/ /g, "%").toUpperCase()}%` } })

        //where.push({ '$companyId$': session.company.codigo_empresa_filial })

        where.push({ '$ativo$': true })

        const orConditions = []

        if (isCustomer) {
            orConditions.push({ '$ISRemetente$': isCustomer })
        }

        if (isSupplier) {
            orConditions.push({ '$ISFornecedor$': isSupplier })
        }

        if (isEmployee) {
            orConditions.push({ '$ISFuncionario$': isEmployee })
        }

        if (isSeller) {
            orConditions.push({ '$isSeller$': isSeller })
        }

        if (orConditions.length > 0) {
            where.push({ [Op.or]: orConditions })
        }

        const partners = await db.Partner.findAll({
            attributes: ['id', 'cpfCnpj', 'surname'],
            order: [['surname', 'asc']],
            where: where,
            limit: 20,
            offset: 0,
        })

        const data = partners.map((partner) => partner.toJSON())

        return Response.json(data)

    } catch (error) {

        return new Response(JSON.stringify({ message: error.message }), { status: 500 })

    }
}