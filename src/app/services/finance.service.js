import * as financeRepository from "@/app/repositories/finance.repository"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll(transaction, params = {}) {
    const session = await getSession()
    const db = new AppContext()
    try {
        return await db.withTransaction(transaction, async (t) => {

            const where = {
                ...params.where,
                companyId: session.company.id
            }

            const result = await financeRepository.findAll(t, { ...params, where })
            return ServiceResponse.success(result)
        })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findOne(transaction, id) {
    const session = await getSession()
    const db = new AppContext()
    try {
        return await db.withTransaction(transaction, async (t) => {

            const result = await financeRepository.findOne(t, {
                where: { id, companyId: session.company.id },
                include: [{ association: 'entries' }, { association: 'partner' }]
            })

            if (!result) {
                return ServiceResponse.error(new Error("Título financeiro não encontrado"))
            }

            return ServiceResponse.success(result)
        })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function create(transaction, data) {
    try {

        const session = await getSession()
        const db = new AppContext()

        return await db.withTransaction(transaction, async (t) => {

            const result = await financeRepository.create(t, {
                ...data,
                companyId: session.company.id
            })

            return ServiceResponse.success(result)
        })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function update(transaction, id, data) {
    const session = await getSession()
    const db = new AppContext()
    try {
        return await db.withTransaction(transaction, async (t) => {

            await financeRepository.update(t, {
                where: { id, companyId: session.company.id }
            }, data)

            const result = await findOne(t, id)
            return result
        })
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
