import ShipmentView from '@/app/views/logistics/shipments'
import * as shipmentAction from '@/app/actions/shipment.action'
import { ServiceStatus } from '@/libs/service'
import { getSession } from '@/libs/session'

export const metadata = {
  title: 'Romaneios',
}

export default async function ShipmentsPage({ params }) {
  try {
    const { slug } = await params
    const selectedId = Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined
    const session = await getSession()
    const companyId = session?.company?.id

    const initialFilters = {
      search: '',
    }

    const initialRange = {
      start: '',
      end: '',
      field: 'departureDate'
    }

    const initialSort = {
      sortBy: 'id',
      sortOrder: 'DESC'
    }

    const result = await shipmentAction.findAll({
      page: 1,
      limit: 50,
      filters: initialFilters,
      range: initialRange,
      companyId,
      ...initialSort
    })

    if (result?.header?.status !== ServiceStatus.SUCCESS) {
      throw result
    }

    const initialTable = {
      items: result.body.rows || [],
      total: result.body.count || 0,
      page: 1,
      limit: 50,
      ...initialSort
    }

    return (
      <ShipmentView
        initialTable={initialTable}
        selectedId={selectedId}
        initialFilters={initialFilters}
        initialRange={initialRange}
        companyId={companyId}
      />
    )
  } catch (error) {
    return error?.body?.message || error.message
  }
}
