"use server"

import { ViewPartners } from "@/app/views/registers/partners/partners.view"
import * as partnerService from "@/app/services/partner.service"

export default async ({ params }) => {
  const { id } = await params;

  const initialFilters = {};

  const result = await partnerService.findAll({
    page: 1,
    limit: 50,
    filters: initialFilters
  })

  const initialData = result.status === 200
    ? { items: result.items || [], total: result.total || 0 }
    : { items: [], total: 0 }

  return <ViewPartners partnerId={id?.[0]} initialData={initialData} initialFilters={initialFilters} />
}
