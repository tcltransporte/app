"use server"

import * as companyService from "@/app/services/settings/company.service"

import { SettingsView } from "@/app/views/settings"
import { ServiceStatus } from "@/libs/service"

export default async () => {
  try {

    const companyResult = await companyService.findOne()

    if (companyResult.status !== ServiceStatus.SUCCESS) {
      throw companyResult
    }

    return <SettingsView initialCompany={companyResult.company} initialUser={companyResult.user} />
  
  } catch (error) {

    return <h1>Erro: {error.message}</h1>

  }
}