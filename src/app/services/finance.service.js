import * as financeRepository from "@/app/repositories/finance.repository"
import { AppContext } from "@/database"
import { ServiceResponse, ServiceStatus } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findAll({ db, transaction } = {}, params = {}) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const where = {
            ...params.where,
            companyId: session.company.id
        }

        const result = await financeRepository.findAll({ db: _db, transaction }, { ...params, where })
        return ServiceResponse.success(result)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function findOne({ db, transaction } = {}, id) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const result = await financeRepository.findOne({ db: _db, transaction }, {
            where: { id, companyId: session.company.id },
            include: [{ association: 'entries' }, { association: 'partner' }]
        })

        if (!result) {
            return ServiceResponse.error(new Error("Título financeiro não encontrado"))
        }

        return ServiceResponse.success(result)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function create({ db, transaction } = {}, data) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const execute = async (t) => {
            return await financeRepository.create({ db: _db, transaction: t }, {
                ...data,
                companyId: session.company.id
            })
        }

        const result = transaction ? await execute(transaction) : await _db.transaction(execute)

        return ServiceResponse.success(result)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}

export async function update({ db, transaction } = {}, id, data) {
    try {
        const session = await getSession()
        const _db = db || new AppContext()

        const execute = async (t) => {
            await financeRepository.update({ db: _db, transaction: t }, {
                where: { id, companyId: session.company.id }
            }, data)
        }

        if (transaction) {
            await execute(transaction)
        } else {
            await _db.transaction(execute)
        }

        return findOne({ db: _db, transaction }, id)
    } catch (error) {
        return ServiceResponse.error(error)
    }
}
