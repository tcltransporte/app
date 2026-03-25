import { RegistersPartners } from "@/app/views/registers/partners"
import * as partnerService from "@/app/services/partner.service"

export default async ({ params }) => {

  const { id } = await params;

  const initialFilters = {};

  const result = await partnerService.findAll({
    page: 1,
    limit: 50,
    filters: initialFilters
  })

  const initialTable = result.header.status === 200
    ? result.body
    : { items: [], total: 0 }

  return (
    <RegistersPartners
      partnerId={id?.[0]}
      initialTable={initialTable}
      initialFilters={initialFilters}
    />
  )
}
