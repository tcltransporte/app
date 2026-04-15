"use server";

import { AppContext } from "@/database";

import * as userRepository from "@/app/repositories/user.repository"
import * as sessionRepository from "@/app/repositories/session.repository"
import * as companyUserRepository from '@/app/repositories/companyUser.repository'

import { getSession } from "@/libs/session";
import { ServiceResponse } from "@/libs/service";

import { cookies } from 'next/headers';

export async function signIn(transaction, { username, password, companyBusinessId, companyId, forceCloseSession = false }) {

  const db = new AppContext()

  const user = await userRepository.findOne(transaction, {
    attributes: ["userId"],
    where: { userName: username }
  });

  if (!user)
    throw ServiceResponse.badRequest("USER_NOT_FOUND", "Usuário não encontrado!")

  const validate = await fetch(process.env.VALIDATE_USER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const validateResult = await validate.json();

  if (!validateResult.d)
    throw ServiceResponse.badRequest("UNAUTHORIZED_PASSWORD", "Senha incorreta!")

  const companyUsers = await companyUserRepository.findAll(transaction, {
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
  });

  if (!companyUsers.length)
    throw ServiceResponse.badRequest("NO_COMPANY_ACCESS")

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
    throw ServiceResponse.badRequest("SELECT_COMPANY_BUSINESS", "Selecione a empresa!", { companyBusinesses })

  const companies = companyUsers
    .filter(x => x.company.companyBusiness.id === companyBusinessId)
    .map(x => ({
      companyId: x.companyId,
      surname: x.company.surname
    }));

  if (!companies.length)
    throw ServiceResponse.badRequest("COMPANY_NOT_FOUND")

  companyId = companyId
    ? Number(companyId)
    : companies.length === 1
      ? companies[0].companyId
      : null;

  if (!companyId)
    throw ServiceResponse.badRequest("SELECT_COMPANY", "Selecione a filial!", { companies })

  const existingSessions = await sessionRepository.findAll(transaction, {
    attributes: ["id"],
    where: { userId: user.userId }
  });

  if (existingSessions.length > 0) {
    if (!forceCloseSession) {
      throw ServiceResponse.badRequest("ACTIVE_SESSION_EXISTS", "Existe uma sessão aberta para o seu usuário.");
    } else {
      // User opted to force close old sessions
      await sessionRepository.destroy(transaction, {
        where: [{ userId: user.userId }]
      });
    }
  }

  const session = await sessionRepository.create(transaction, {
    userId: user.userId,
    companyId,
    lastAcess: new Date(),
    expireIn: 1
  });

  const result = { token: session.id };
  const cookieStore = await cookies();
  cookieStore.set('authorization', result.token, { path: '/', maxAge: 60 * 60 * 8 });

  return result
}

export async function signOut(transaction) {
  const session = await getSession()
  await sessionRepository.destroy(transaction, { where: [{ id: session.id }] })

  const cookieStore = await cookies();
  cookieStore.delete('authorization');

  return true
}
