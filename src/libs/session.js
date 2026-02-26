// src/lib/auth.js
import { cookies, headers } from "next/headers"
import { AppContext } from "@/database"
import { UnauthorizedError } from "@/libs/errors/helpers/unauthorized-error"
import * as sessionRepository from "@/app/repositories/session.repository"

export async function getSession() {
  try {

    const db = new AppContext()

    return db.transaction(async (transaction) => {

      const header = await headers()

      const cookie = await cookies()
    
      let token = header.get("authorization")?.replace(/^Bearer\s+/i, "")
    
      if (!token) {
        token = cookie.get("authorization")?.value
      }

      if (!token) {
        throw new UnauthorizedError()
      }

      const session = await sessionRepository.findOne({ db, transaction }, {
        attributes: ['id', 'lastAcess', 'expireIn'],
        include: [
          { model: db.User, as: 'user', attributes: ['userId', 'userName'] },
          { model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'name', 'surname'] }
        ],
        where: [{ id: token }]
      })
  
      if (!session) {
        throw new UnauthorizedError()
      }
  
      return session
  
    })

  } catch (error) {

    throw new UnauthorizedError(error.message)

  }
}