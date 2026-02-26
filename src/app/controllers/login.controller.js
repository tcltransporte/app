"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/libs/errors/helpers/unauthorized-error";

import { AppContext } from "@/database";

import * as userRepository from "@/app/repositories/user.repository";
import * as sessionRepository from "../repositories/session.repository";
import { getSession } from "@/libs/session";

export async function signIn({ username, password }) {
  
  const validate = await fetch(process.env.VALIDATE_USER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })

  const result = await validate.json()

  if (!result.d) throw new UnauthorizedError('Senha incorreta!')

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    const user = await userRepository.findOne({ db, transaction }, { attributes: ['userId'], where: [{ userName: username }] })

    const session = await sessionRepository.create({ db, transaction }, { userId: user.userId, companyId: 1, lastAcess: new Date(), expireIn: 5 })

    const token = session.id

    const cookieStore = await cookies()
  
    cookieStore.set("authorization", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    })
  
    return { token }
  

  })

}

export async function signOut() {

  const session = await getSession()

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    await sessionRepository.destroy({ db, transaction }, { where: [{ id: session.id }] })

    const cookieStore = await cookies()
  
    cookieStore.delete("authorization")
  
    redirect("/login")
  
  })

}