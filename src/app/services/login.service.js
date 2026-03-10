"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppContext } from "@/database";

import * as userRepository from "@/app/repositories/user.repository"
import * as sessionRepository from "@/app/repositories/session.repository"
import * as companyUserRepository from '@/app/repositories/companyUser.repository'

import { getSession } from "@/libs/session";
import { ServiceResponse } from "@/libs/service";

export async function signIn({ username, password, companyBusinessId, companyId }) {

  try {

    const db = new AppContext();

    return await db.transaction(async (transaction) => {

      const user = await userRepository.findOne(
        { db, transaction },
        { attributes: ["userId"], where: { userName: username } }
      );

      if (!user)
        return ServiceResponse.badRequest("USER_NOT_FOUND", "Usuário não encontrado!");

        
      const validate = await fetch(process.env.VALIDATE_USER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await validate.json();

      if (!result.d)
        return ServiceResponse.badRequest("UNAUTHORIZED_PASSWORD", "Senha incorreta!");

      const companyUsers = await companyUserRepository.findAll(
        { db, transaction },
        {
          attributes: ["companyId"],
          include: [
            {
              model: db.Company, as: "company", attributes: ["surname"],
              include: [
                {
                  model: db.CompanyBusiness, as: "companyBusiness", attributes: ["id", "name"]
                }
              ]
            }
          ],
          where: { userId: user.userId }
        }
      );

      if (!companyUsers.length)
        return ServiceResponse.badRequest("NO_COMPANY_ACCESS");

      const companyBusinesses = [
        ...new Map(
          companyUsers.map(x => [
            x.company.companyBusiness.id,
            x.company.companyBusiness
          ])
        ).values()
      ];

      companyBusinessId = companyBusinessId
        ? Number(companyBusinessId)
        : companyBusinesses.length === 1
          ? companyBusinesses[0].id
          : null;

      if (!companyBusinessId)
        return ServiceResponse.badRequest(
          "SELECT_COMPANY_BUSINESS",
          "Selecione a empresa!",
          { companyBusinesses }
        );

      const companies = companyUsers
        .filter(x => x.company.companyBusiness.id === companyBusinessId)
        .map(x => ({
          companyId: x.companyId,
          surname: x.company.surname
        }));

      if (!companies.length)
        return ServiceResponse.badRequest("COMPANY_NOT_FOUND");

      companyId = companyId
        ? Number(companyId)
        : companies.length === 1
          ? companies[0].companyId
          : null;

      if (!companyId)
        return ServiceResponse.badRequest(
          "SELECT_COMPANY",
          "Selecione a filial!",
          { companies }
        );

      const session = await sessionRepository.create(
        { db, transaction },
        {
          userId: user.userId,
          companyId,
          lastAcess: new Date(),
          expireIn: 5
        }
      );

      return ServiceResponse.ok({ token: session.id });

    });

  } catch (error) {

    return ServiceResponse.error(error);

  }

}

export async function signOut() {
  try {

    const session = await getSession()

    const db = new AppContext()
  
    await db.transaction(async (transaction) => {
  
      await sessionRepository.destroy({ db, transaction }, { where: [{ id: session.id }] })
  
    })
    
    return ServiceResponse.ok()
    
  } catch (error) {

    return ServiceResponse.error(error)
    
  }
}