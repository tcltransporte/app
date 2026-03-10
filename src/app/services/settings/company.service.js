"use server"

import * as companyRepository from "@/app/repositories/company.repository"
import * as userRepository from "@/app/repositories/user.repository"
import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"
import { NextResponse } from "next/server"

export async function findOne() {
    try {

        const session = await getSession()

        const db = new AppContext()
    
        const response = await db.transaction(async (transaction) => {
    
            const company = await companyRepository.findOne({ db, transaction }, {
                attributes: ['id', 'name', 'surname'],
                where: { codigo_empresa_filial: session.company.id }
            })

            const user = await userRepository.findOne({ db, transaction }, {
                attributes: ['id', 'userName'],
                where: { userId: session.user.id }
            })

            return { company, user }

        })

        return ServiceResponse.ok(response)
    
    } catch (error) {

        return ServiceResponse.error(error)

    }
}