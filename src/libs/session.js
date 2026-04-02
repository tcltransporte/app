// src/lib/auth.js
import { cookies, headers } from "next/headers"
import { AppContext } from "@/database"
import * as sessionRepository from "@/app/repositories/session.repository"
import { ServiceResponse, ServiceStatus } from "./service"

export async function getSession(transaction = null) {

  const db = new AppContext()

  const header = await headers()

  const cookie = await cookies()

  let token = header.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!token) {
    token = cookie.get("authorization")?.value
  }

  if (!token) {
    throw ServiceResponse.unauthorized('TOKEN_REQUIRED', 'Informe o token!')
  }

  return await db.withTransaction(transaction, async (t) => {

    const session = await sessionRepository.findOne(t, {
      attributes: ['id', 'lastAcess', 'expireIn'],
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'userName'] },
        {
          model: db.Company, as: 'company', attributes: ['id', 'name', 'surname'],
          include: [
            { model: db.CompanyBusiness, as: 'companyBusiness', attributes: ['id', 'name'] }
          ]
        }
      ],
      where: [{ id: token }]
    })

    if (!session) {
      throw ServiceResponse.unauthorized('UNAUTHORIZED_TOKEN', 'Token não encontrado!')
    }

    // Check if session has expired
    if (session.expireIn && session.lastAcess) {

      const lastAcessDate = new Date(session.lastAcess)
      const now = new Date()

      // Renew session: update lastAcess on each valid access
      await sessionRepository.update(t, { where: [{ id: session.id }] }, { lastAcess: now })

    }

    return session

  })

}
