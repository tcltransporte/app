"use server"

import * as companyRepository from "@/app/repositories/company.repository"
import { AppContext } from "@/database"
import { ServiceResponse } from "@/libs/service"
import { getSession } from "@/libs/session"
import { NextResponse } from "next/server"

export async function findOne() {
    try {

        const session = await getSession()

        const db = new AppContext()
    
        const company = await db.transaction(async (transaction) => {
    
            return await companyRepository.findOne({ db, transaction }, {
                attributes: ['id', 'name', 'surname'],
                where: { codigo_empresa_filial: session.company.id }
            })

        })

        return ServiceResponse.ok({ company })
    
    } catch (error) {

        return ServiceResponse.error(error)

    }
}