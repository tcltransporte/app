import { RegistersPartners } from "@/app/views/registers/partners"
import * as partnerAction from "@/app/actions/partner.action"
import { ServiceStatus } from "@/libs/service";

export default async ({ params }) => {
  try {

    const { id } = await params;

    const initialFilters = {};

    const partnerResult = await partnerAction.findAll({
      page: 1,
      limit: 50,
      filters: initialFilters
    })

    if (partnerResult.header.status !== ServiceStatus.SUCCESS) {
      throw partnerResult
    }

    const initialTable = partnerResult.body

    return (
      <RegistersPartners
        partnerId={id?.[0]}
        initialTable={initialTable}
        initialFilters={initialFilters}
      />
    )

  } catch (error) {
    return error.body.message
  }
}
