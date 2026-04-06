"use server"

import { redirect } from "next/navigation"
import * as companyAction from "@/app/actions/settings/company.action"
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
    const companyResult = await companyAction.findOne()

    if (companyResult.header.status !== ServiceStatus.SUCCESS) {
      throw companyResult
    }

    let initialStatusesConfig = null;
    if (activeSlug === 'status') {
      const result = await companyAction.getStatusesConfig();
      if (result.header.status === ServiceStatus.SUCCESS) {
        initialStatusesConfig = result.body;
      }
    }

    return (
      <SettingsView 
        initialCompany={companyResult.body.company} 
        initialUser={companyResult.body.user} 
        activeSlug={activeSlug}
        initialStatusesConfig={initialStatusesConfig}
      />
    )
  
  } catch (error) {
    return <h1>Erro: {error?.body?.message || error.message}</h1>
  }
}
