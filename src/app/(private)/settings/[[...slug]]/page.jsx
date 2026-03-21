"use server"

import { redirect } from "next/navigation"
import * as companyService from "@/app/services/settings/company.service"
import { SettingsView } from "@/app/views/settings"
import { ServiceStatus } from "@/libs/service"

export default async ({ params }) => {
  const { slug } = await params;
  
  // Default to 'empresa' if no slug provided
  if (!slug || slug.length === 0) {
    redirect('/settings/empresa');
  }

  const activeSlug = slug[0];

  try {
    const companyResult = await companyService.findOne()

    if (companyResult.status !== ServiceStatus.SUCCESS) {
      throw companyResult
    }

    let initialStatusesConfig = null;
    if (activeSlug === 'status') {
      const result = await companyService.getStatusesConfig();
      if (result.status === ServiceStatus.SUCCESS) {
        initialStatusesConfig = result;
      }
    }

    return (
      <SettingsView 
        initialCompany={companyResult.company} 
        initialUser={companyResult.user} 
        activeSlug={activeSlug}
        initialStatusesConfig={initialStatusesConfig}
      />
    )
  
  } catch (error) {
    return <h1>Erro: {error.message}</h1>
  }
}
