"use server"

import * as companyRepository from "@/app/repositories/company.repository"
import * as userRepository from "@/app/repositories/user.repository"

import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"

export async function findOne() {
    try {

        const session = await getSession()

        const db = new AppContext()

        const result = await db.transaction(async (transaction) => {

            const company = await companyRepository.findOne({ db, transaction }, {
                attributes: ['id', 'name', 'surname'],
                include: [
                    {
                        model: db.CompanyBusiness, as: 'companyBusiness', attributes: ['id', 'name'],
                    }
                ],
                where: { codigo_empresa_filial: session.company.id }
            })

            const user = await userRepository.findOne({ db, transaction }, {
                attributes: ['id', 'userName'],
                where: { userId: session.user.id }
            })

            return { 
                company: company ? JSON.parse(JSON.stringify(company)) : null, 
                user: user ? JSON.parse(JSON.stringify(user)) : null 
            }

        })

        return ServiceResponse.success(result)

    } catch (error) {

        return ServiceResponse.error(error)

    }
}