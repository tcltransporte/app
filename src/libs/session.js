// src/lib/auth.js
import { cookies, headers } from "next/headers"
import { AppContext } from "@/database"
import * as sessionRepository from "@/app/repositories/session.repository"
import { ServiceStatus } from "./service"

export async function getSession() {

  const db = new AppContext()

  return db.transaction(async (transaction) => {

    const header = await headers()

    const cookie = await cookies()
  
    let token = header.get("authorization")?.replace(/^Bearer\s+/i, "")
  
    if (!token) {
      token = cookie.get("authorization")?.value
    }

    if (!token) {
      throw {
        status: ServiceStatus.UNAUTHORIZED,
        code: "TOKEN_REQUIRED",
        message: "Informe o token!"
      }
    }

    const session = await sessionRepository.findOne({ db, transaction }, {
      attributes: ['id', 'lastAcess', 'expireIn'],
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'userName'] },
        { model: db.Company, as: 'company', attributes: ['id', 'name', 'surname'] }
      ],
      where: [{ id: token }]
    })

    if (!session) {
      throw {
        status: ServiceStatus.UNAUTHORIZED,
        code: "UNAUTHORIZED_TOKEN",
        message: 'Token não encontrado!'
      }
    }

    return session

  })

}