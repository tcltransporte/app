"use server"

import * as companyService from "@/app/controllers/settings/company.controller"

import { SettingsView } from "@/views/settings"
import { ErrorRender } from "@/libs/errors/error-render"

export default async () => {
  try {

    const company = await companyService.findOne()

    return <SettingsView initialCompany={company} />
  
  } catch (error) {

    return <ErrorRender error={error} />

  }
}