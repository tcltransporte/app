"use server"

import * as companyService from "@/app/services/settings/company.service"

import { SettingsView } from "@/app/views/settings"
import { ServiceRequest } from "@/libs/service"

export default async () => {
  try {

    const companyResult = await ServiceRequest.run(companyService.findOne())

    return <SettingsView initialCompany={companyResult.company} initialUser={companyResult.user} />
  
  } catch (error) {

    return <h1>Erro: {error.message}</h1>

  }
}