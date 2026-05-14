import KnowledgeView from '@/app/views/logistics/knowledge'
import * as cteAction from '@/app/actions/cte.action'
import { ServiceStatus } from '@/libs/service'
import { getSession } from '@/libs/session'

export const metadata = {
  title: 'Conhecimentos de Transporte',
}

export default async function KnowledgePage({ params }) {
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
      field: 'issuedAt'
    }

    const initialSort = {
      sortBy: 'issuedAt',
      sortOrder: 'DESC'
    }

    const result = await cteAction.findAll({
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
      <KnowledgeView
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
