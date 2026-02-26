"use server"

import * as companyRepository from "@/app/repositories/company.repository"
import { AppContext } from "@/database"
import { getSession } from "@/libs/session"

export async function findOne() {

    const session = await getSession()

    const db = new AppContext()

    return await db.transaction(async (transaction) => {

        return await companyRepository.findOne({ db, transaction }, {
            attributes: ['codigo_empresa_filial', 'name', 'surname'],
            where: { codigo_empresa_filial: session.company.codigo_empresa_filial }
        })

    })


}