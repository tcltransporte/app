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

    const result = await db.transaction(async (transaction) => {

      const user = await userRepository.findOne(
        { db, transaction },
        { attributes: ["userId"], where: { userName: username } }
      );

      if (!user)
        throw { code: "USER_NOT_FOUND", message: "Usuário não encontrado!" };

      const validate = await fetch(process.env.VALIDATE_USER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const validateResult = await validate.json();

      if (!validateResult.d)
        throw { code: "UNAUTHORIZED_PASSWORD", message: "Senha incorreta!" };

      const companyUsers = await companyUserRepository.findAll(
        { db, transaction },
        {
          attributes: ["companyId"],
          include: [
            {
              model: db.Company,
              as: "company",
              attributes: ["surname"],
              include: [
                {
                  model: db.CompanyBusiness,
                  as: "companyBusiness",
                  attributes: ["id", "name"]
                }
              ]
            }
          ],
          where: { userId: user.userId }
        }
      );

      if (!companyUsers.length)
        throw { code: "NO_COMPANY_ACCESS" };

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
        throw {
          code: "SELECT_COMPANY_BUSINESS",
          message: "Selecione a empresa!",
          data: { companyBusinesses }
        };

      const companies = companyUsers
        .filter(x => x.company.companyBusiness.id === companyBusinessId)
        .map(x => ({
          companyId: x.companyId,
          surname: x.company.surname
        }));

      if (!companies.length)
        throw { code: "COMPANY_NOT_FOUND" };

      companyId = companyId
        ? Number(companyId)
        : companies.length === 1
          ? companies[0].companyId
          : null;

      if (!companyId)
        throw {
          code: "SELECT_COMPANY",
          message: "Selecione a filial!",
          data: { companies }
        };

      const session = await sessionRepository.create(
        { db, transaction },
        {
          userId: user.userId,
          companyId,
          lastAcess: new Date(),
          expireIn: 5
        }
      );

      return { token: session.id };

    });

    return ServiceResponse.ok(result);

  } catch (error) {

    if (error.code)
      return ServiceResponse.badRequest(error.code, error.message, error.data);

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