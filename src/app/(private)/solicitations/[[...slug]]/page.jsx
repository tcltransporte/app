import SolicitationView from '@/app/views/solicitations';
import * as solicitationService from '@/app/services/solicitation.service';
import { findAll as findTypeAll } from '@/app/services/solicitationType.service';
import { ServiceStatus } from '@/libs/service';
import { getSession } from '@/libs/session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function SolicitationPage({ params }) {
  try {

    const { slug } = await params;

    const typeHash = Array.isArray(slug) ? slug[0] : slug;
    const selectedId = Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined;

    const session = await getSession();

    if (!session) redirect('/sign-in');

    let solicitationType = null;

    if (typeHash) {
      const typeResp = await findTypeAll({ filters: { hash: typeHash } });
      if (typeResp.header.status === ServiceStatus.SUCCESS && typeResp.body.items.length > 0) {
        solicitationType = typeResp.body.items[0];
      }
    }

    const dateFieldOptions = [
      { label: 'Data da Solicitação', value: 'date' },
      { label: 'Data de Previsão', value: 'forecastDate' },
    ];

    const today = format(new Date(), 'yyyy-MM-dd');
    const initialFilters = { typeHash };
    const initialRange = { start: today, end: today, field: 'date' };

    const solicitationsResult = await solicitationService.findAll({}, {
      page: 1,
      limit: 50,
      filters: initialFilters,
      range: initialRange,
      sortBy: 'number',
      sortOrder: 'DESC'
    });

    if (solicitationsResult.header.status !== ServiceStatus.SUCCESS) {
      throw solicitationsResult
    }

    const initialTable = solicitationsResult.body;

    return (
      <SolicitationView
        initialTable={initialTable}
        initialFilters={initialFilters}
        initialRange={initialRange}
        dateFieldOptions={dateFieldOptions}
        solicitationType={solicitationType}
        selectedId={selectedId}
      />
    );

  } catch (error) {
    return error.body?.message || error.message
  }
}
